# Especificação arquitetural de áudio

## Objetivo

O áudio é uma parte estrutural do aprendizado de mandarim. Cada palavra, exemplo, fala de diálogo e atividade de escuta deve poder relacionar texto escrito, pinyin, significado e pronúncia. A arquitetura precisa produzir áudio consistente para o conteúdo publicado, evitar custos duplicados, permitir estudo offline e manter a interface fluida em dispositivos móveis.

Este documento adapta o blueprint fornecido para o stack atual do Mapa de Mandarim. A arquitetura mantém a separação entre ingestão de conteúdo, geração de áudio, armazenamento, registro, preload e reprodução.

## Pipeline oficial

```text
JSON de lição ou conteúdo administrativo
        ↓
Backend Node.js + TypeScript
        ↓
Hash MD5 do texto + parâmetros de voz
        ↓
Verificação de áudio existente
        ↓
Azure Speech API, apenas quando necessário
        ↓
Ficheiro MP3 em object storage
        ↓
CDN e URL estável
        ↓
Registro de metadados no banco
        ↓
Preload da lição no dispositivo
        ↓
Cache local
        ↓
Reprodução offline com controles de estado
```

| Etapa | Camada | Tecnologia alvo | Responsabilidade |
|---|---|---|---|
| Importação | Backend | Node.js + TypeScript | Ler lições, palavras, frases e missões |
| Deduplicação | Backend | MD5 | Reutilizar áudio já gerado para o mesmo conteúdo |
| Voz neural | Cloud API | Azure Speech | Gerar mandarim com voz neural consistente |
| Armazenamento | Storage | AWS S3 ou Cloudflare R2 | Guardar MP3 e metadados de objeto |
| Distribuição | CDN | CDN do storage ou Cloudflare | Entregar áudio com baixa latência |
| Registro | Database | Drizzle + MySQL/TiDB atual | Associar conteúdo, hash, URL e versão |
| Preload | Mobile | Expo FileSystem | Baixar os áudios da lição antes do estudo |
| Reprodução | Mobile | Expo Audio atual | Tocar áudio sem bloquear a interface |

## 1. Geração de voz

A voz padrão recomendada para o mandarim simplificado é `zh-CN-XiaoxiaoNeural`. Ela deve ser utilizada como configuração editorial padrão, mas a voz não deve ficar hardcoded nas telas. O áudio deve registrar a voz, o idioma, a velocidade e a versão do gerador.

```json
{
  "language": "zh-CN",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": 0.85,
  "format": "audio-24khz-48kbitrate-mono-mp3"
}
```

A geração deve receber uma unidade textual completa. O texto pode ser uma palavra, uma frase de exemplo, uma linha de diálogo ou um prompt de escuta. O pinyin não deve ser enviado para o sintetizador quando o objetivo for pronunciar hanzi; ele permanece como apoio visual e dado editorial.

A velocidade `0.85` é uma boa configuração inicial pedagógica, mas deve ser uma propriedade do áudio gerado ou da reprodução. Não se deve gerar automaticamente uma nova cópia para cada velocidade se a variação puder ser aplicada no player. A velocidade de geração só deve variar quando a prosódia produzida pelo TTS precisar ser diferente.

## 2. Deduplicação por conteúdo

Antes de chamar a API paga, o backend deve calcular um hash determinístico. O hash deve considerar pelo menos:

```text
texto normalizado
idioma
voz
velocidade de geração
formato
versão do gerador
```

Um MD5 pode ser usado como identificador de deduplicação, conforme o blueprint. O hash não deve depender da lição que utiliza o áudio, porque a mesma frase pode aparecer em muitos nós e missões.

```text
hash = MD5(text + language + voice + rate + format + generatorVersion)
```

O fluxo deve ser:

```text
calcular hash
   ↓
procurar audio_asset pelo hash
   ├── encontrado → reutilizar URL
   └── ausente → gerar, armazenar e registrar
```

O texto normalizado deve preservar os caracteres chineses, remover espaços acidentais nas extremidades e aplicar uma política estável de pontuação. Alterar o texto, a voz ou a versão do gerador deve produzir um novo hash. Assim, um áudio antigo nunca é reutilizado para um texto diferente.

## 3. Processamento assíncrono

A importação de uma lição pequena pode gerar áudio de forma síncrona se o áudio já existir ou se o administrador estiver a gerar apenas uma prévia. Lotes maiores devem ser processados de forma assíncrona.

```text
Importar 500 frases
        ↓
Validar documento
        ↓
Criar jobs de áudio
        ↓
Responder ao administrador com o estado do lote
        ↓
Processar jobs em segundo plano
        ↓
Atualizar cada audio_asset
        ↓
Liberar o conteúdo quando os critérios de publicação forem atendidos
```

Uma fila como BullMQ pode ser introduzida quando houver ambiente persistente para workers. No sandbox ou num servidor simples, a primeira versão pode usar uma tabela de jobs e um worker controlado pelo backend. A decisão de usar BullMQ deve considerar Redis, reexecução, limites da Azure API e observabilidade.

Estados recomendados para um áudio:

```text
pending
processing
ready
failed
stale
```

Falhas temporárias devem permitir retry com limite. Falhas permanentes devem aparecer na pré-visualização administrativa e impedir a publicação se aquele áudio for obrigatório para a atividade.

## 4. Armazenamento e registro

Os ficheiros MP3 não devem ser armazenados diretamente no banco. O banco guarda metadados e a URL ou chave do objeto.

```text
audio_assets
├── id
├── contentType
├── contentId
├── lexicalEntryId
├── textHash
├── language
├── voice
├── rate
├── format
├── generatorVersion
├── storageKey
├── publicUrl
├── durationMs
├── fileSizeBytes
├── status
├── createdAt
└── updatedAt
```

`contentType` deve distinguir pelo menos:

```text
lexical_entry
example_sentence
dialogue_line
lesson_activity
mission_step
listening_prompt
```

Uma mesma unidade textual pode ser reutilizada por diferentes relações de conteúdo através do `textHash`. O `audio_assets` pode ter uma chave única baseada no hash, enquanto as relações editoriais indicam onde o áudio é usado.

O storage deve utilizar bucket privado ou público conforme a política de distribuição. Se o bucket for privado, o backend pode emitir URLs assinadas com expiração. Se o conteúdo for público e imutável por hash, URLs públicas via CDN simplificam o preload e o cache. A escolha final depende da configuração do ambiente de produção.

## 5. Preload e cache mobile

Ao abrir uma lição, o aplicativo deve conhecer os áudios necessários no percurso atual. O preload deve ser progressivo:

```text
Abrir lição
   ↓
Obter metadados e URLs
   ↓
Verificar cache local
   ↓
Baixar em lote os ficheiros ausentes
   ↓
Marcar disponibilidade local
   ↓
Permitir início imediato do estudo
```

A primeira versão deve priorizar o áudio da etapa atual e da missão atual. O restante pode ser baixado em segundo plano. Não é necessário bloquear a abertura da lição até todos os áudios estarem prontos.

A estrutura local pode usar uma chave derivada do hash:

```text
{documentDirectory}/audio/{textHash}.mp3
```

O cache deve guardar:

```text
textHash
localUri
fileSizeBytes
downloadedAt
lastAccessedAt
```

Quando o hash mudar, o arquivo antigo deixa de ser válido. O aplicativo pode remover arquivos antigos por política de tamanho ou idade. Ao sair da tela, os players devem ser descarregados, mas os arquivos em cache não devem ser apagados imediatamente.

## 6. Reprodução no Expo

O projeto atual utiliza `expo-audio` no Expo SDK 57. O blueprint menciona `expo-av`, mas a implementação deve seguir a dependência efetivamente instalada no Mapa de Mandarim, evitando introduzir duas camadas de reprodução para a mesma responsabilidade.

Deve ser criado um serviço ou hook único, por exemplo:

```text
hooks/use-audio-player.ts
lib/audio-cache.ts
lib/audio-service.ts
components/ui/audio-button.tsx
```

O componente `AudioButton` não deve conhecer Azure, S3 ou URLs de CDN. Ele recebe um identificador de áudio ou uma referência de conteúdo e delega ao serviço.

O serviço deve:

- Reproduzir um arquivo local quando existir.
- Fazer download quando houver URL remota.
- Usar TTS como fallback apenas quando configurado.
- Evitar múltiplas reproduções concorrentes.
- Permitir parar e repetir.
- Informar carregamento e erro.
- Descarregar o player ao desmontar a tela.
- Respeitar o modo silencioso do iOS através da configuração suportada pelo módulo escolhido.

A configuração `playsInSilentModeIOS: true` deve ser aplicada na API equivalente do `expo-audio` usada pelo SDK atual. Não se deve copiar a opção literalmente sem confirmar a API da versão instalada.

## 7. Fallback TTS

O TTS local ou do navegador deve ser fallback, não fonte principal do conteúdo publicado.

```text
Existe MP3 aprovado?
   ├── Sim → reproduzir MP3
   └── Não
        ↓
Existe MP3 em processamento?
   ├── Sim → mostrar estado e permitir TTS se autorizado
   └── Não → usar TTS local como fallback
```

No conteúdo em rascunho, o TTS permite que o administrador pré-visualize a lição antes da geração final. No conteúdo publicado, o administrador deve poder definir se a ausência de MP3 é aceitável ou bloqueia a publicação.

## 8. Uso nas lições, missões e SRS

O áudio deve estar presente em todas as camadas do percurso:

```text
Nó
├── Contexto: áudio por linha
├── Vocabulário: áudio por palavra
├── Gramática: áudio por exemplo
├── Atividade: áudio do prompt ou da resposta
├── Missão: áudio por turno
└── Futuro flashcard: áudio na frente ou no verso
```

O áudio deve funcionar como apoio durante leitura e como conteúdo principal em atividades de escuta. Uma atividade de escuta não deve revelar automaticamente o texto antes da resposta.

No SRS, o cartão pode mostrar o hanzi e permitir ouvir a pronúncia. Uma variante futura pode mostrar apenas áudio e pedir que o aluno identifique o hanzi ou significado. O áudio de revisão deve referenciar a mesma entrada ou frase normalizada, aproveitando a deduplicação global.

## 9. Integração com importação JSON

O JSON de autoria deve permitir áudio opcional:

```json
{
  "hanzi": "你好！",
  "pinyin": "nǐ hǎo!",
  "translation": "Olá!",
  "audio": {
    "required": true,
    "source": "azure",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": 0.85,
    "url": null
  }
}
```

Também deve aceitar áudio enviado manualmente:

```json
{
  "audio": {
    "required": false,
    "source": "uploaded",
    "url": "https://cdn.example.com/audio/nihao.mp3"
  }
}
```

O importador deve gerar ou enfileirar áudio somente depois da validação do texto. Se o texto mudar, o áudio anterior deve ser marcado como `stale`.

## 10. Segurança e custos

A chave da Azure Speech API nunca deve chegar ao aplicativo mobile nem ao JSON público. A geração deve ocorrer no backend ou worker autorizado. O app recebe apenas metadados e URL de distribuição.

A deduplicação por hash é a principal proteção contra custo repetido. O backend também deve impor:

- Limite de tamanho do lote.
- Limite de caracteres por job.
- Retry com backoff.
- Registro de erros da API.
- Controle de quem pode gerar ou regenerar áudio.
- Aprovação administrativa antes de publicar voz nova.

O sistema não deve regerar áudio quando apenas a descrição em português ou o pinyin mudar, desde que o texto chinês e os parâmetros de voz permaneçam iguais.

## 11. Ordem de implementação

### Marco 1 — Serviço de reprodução

Implementar `AudioButton`, player único, estados de loading, erro e conclusão. Usar um áudio de teste local ou URL controlada. Integrar ao contexto, vocabulário e missão.

### Marco 2 — Modelo de áudio

Adicionar `audio_assets`, referências de áudio no domínio e campos opcionais no contrato JSON. Implementar hash determinístico e consulta de assets existentes.

### Marco 3 — Cache local

Adicionar download via Expo FileSystem, diretório por hash, verificação de existência e descarregamento do player ao sair da tela.

### Marco 4 — Backend de geração

Adicionar integração Azure Speech, upload para S3/R2, registro de metadados e retries. Manter TTS local como fallback.

### Marco 5 — Importação administrativa

Incluir áudio na validação, pré-visualização, geração assíncrona e publicação de lições e missões.

### Marco 6 — Atividades de escuta

Adicionar tipos `listen_meaning`, `listen_sentence_choice`, `listen_word_choice` e `listen_fill_blank`. O texto deve permanecer oculto até a tentativa quando essa for a intenção pedagógica.

### Marco 7 — Preload avançado

Pré-carregar os áudios da lição e missão atuais, disponibilizar indicador de preparação e criar política de limpeza do cache.

## Decisão final

A arquitetura adotada será híbrida e orientada a conteúdo:

```text
Azure Speech + voz neural consistente
        ↓
Deduplicação por hash
        ↓
S3/R2 + CDN
        ↓
Registro de metadados
        ↓
Preload e cache local
        ↓
Expo Audio no mobile
        ↓
TTS local apenas como fallback
```

O blueprint fornecido é adequado como direção de produção. A principal adaptação necessária é usar `expo-audio`, que já está instalado no projeto, em vez de introduzir `expo-av` sem necessidade. A segunda adaptação é começar com processamento assíncrono compatível com o ambiente atual e adotar BullMQ quando houver Redis e worker persistente.

## Referências

[1]: ../docs/learning-vocabulary-srs-admin-analysis.md "Análise consolidada de vocabulário, SRS e autoria administrativa"

[2]: ../docs/nodes-and-missions-finalization-spec.md "Especificação de fechamento de nós e missões"

[3]: https://learn.microsoft.com/azure/ai-services/speech-service/text-to-speech "Microsoft Azure Speech Text to Speech"

[4]: https://docs.expo.dev/versions/latest/sdk/audio/ "Expo Audio"
