# Estado atual do desenvolvimento — Mapa de Mandarim

**Data do registo:** 2026-09-03  
**Objetivo:** entregar um ponto de continuidade claro para a próxima IA ou pessoa que assumir o desenvolvimento.

## Resumo executivo

O Mapa de Mandarim já possui uma base funcional de aprendizagem móvel: mapa de progressão, nós, lições, atividades, missões e vocabulário inicial. A infraestrutura inicial de áudio também foi preparada, incluindo reprodução mobile, fallback TTS, cache local, modelo de assets e serviço server-side para futura geração neural.

O ciclo entre **lição e vocabulário pessoal** já está integrado: a prática de uma atividade identifica as palavras do nó, cria ou atualiza os estados pessoais e registra `lastSeenAt`. O SRS, os flashcards e a aba de revisão continuam como a próxima grande lacuna funcional.

## O que está funcional

| Área | Estado |
|---|---|
| Mapa de aprendizagem | Funcional com dados MVP |
| Trilhas e nós | Funcionais |
| Progressão do aluno | Funcional e persistida quando há banco disponível |
| Lições | Funcionais |
| Atividades | Escolha múltipla, ordenação, escolha contextual e preenchimento de lacuna |
| Missões | MVP funcional, incluindo missão final com diálogo em vários turnos |
| Vocabulário editorial | Entradas em `lexical_entries` com Hanzi, pinyin, significado e exemplos |
| Estados pessoais | `user_word_states` com estados `new`, `learning` e `known`, atualizados automaticamente na prática da lição |
| Pesquisa de dicionário | Funcional |
| Áudio mobile | `AudioButton` com `expo-audio` |
| Fallback de pronúncia | `expo-speech` |
| Cache local | Cache persistente por hash em `documentDirectory/audio` |
| Preload | Preload progressivo de URLs de áudio encontradas no payload da lição |
| Modelo de áudio | `audio_assets` com hash, metadados, estados e URL |
| Azure Speech | Serviço server-side implementado, dependente de configuração |
| Importação JSON | Contrato, validação e gravação de rascunhos implementados |
| Área administrativa visual | Ainda não implementada |
| Flashcards | Modelo, agenda e sessão visual de revisão implementados; integração com Hoje ainda pendente |
| SRS | Schema, motor determinístico, API e aba Revisar implementados |

## Arquitetura de conteúdo

A separação de responsabilidades definida é:

```text
Autoria pedagógica
      ↓
Conteúdo importado e validado
      ↓
Conteúdo publicado de trilhas, nós e missões
      ↓
Execução da lição e progresso do aluno
      ↓
Vocabulário pessoal
      ↓
SRS e revisão
```

Um nó contém etapas ordenadas, vocabulário, atividades e uma aplicação ou missão. O progresso do nó mede a conclusão das atividades essenciais; não deve ser confundido com o domínio lexical ou com a agenda do SRS.

## Vocabulário atual

As entradas editoriais vivem em:

```text
lexical_entries
```

Campos principais:

```text
id
hanzi
pinyin
meaningPtBr
exampleHanzi
examplePtBr
```

O estado pessoal vive em:

```text
user_word_states
```

Com os estados:

```text
new       → disponível ou ainda não estudada
learning  → apresentada/praticada pelo aluno
known     → conhecida ou dominada segundo a política do produto
```

### Integração de exposição entregue

Ao submeter uma atividade, o sistema agora executa automaticamente:

```text
identificar palavras vinculadas ao nó
      ↓
criar user_word_states ausentes
      ↓
atualizar lastSeenAt
      ↓
marcar palavras novas como learning
```

A operação é idempotente, deduplica as entradas do nó e preserva uma palavra já marcada como `known`. A mesma regra existe no banco e no fallback em memória do preview, mantendo a Biblioteca consistente nos dois ambientes.

A exposição **não marca automaticamente uma palavra como `known`**. Exposição e domínio continuam sendo conceitos diferentes.

## SRS em implementação

A primeira camada do SRS já está disponível:

- Tabelas `srs_cards` e `srs_reviews`, com a migração `0006_srs_cards_reviews.sql`.
- Agenda `dueAt`, intervalo, caixa, fator de facilidade, contagem de revisões e lapsos.
- Motor puro e determinístico para as avaliações `forgot`, `hard` e `easy`.
- Criação idempotente de cartões por usuário e entrada lexical.
- Consulta de cartões vencidos e submissão transacional de avaliações pela API.
- Histórico protegido por `clientEventId` para evitar avaliações duplicadas.

Ainda faltam a integração das revisões pendentes na tela Hoje e a ativação automática de cartões a partir de todo o percurso de aprendizagem. A sessão visual da aba Revisar já está disponível com revelação, áudio e avaliações.

A arquitetura recomendada é manter o SRS separado do vocabulário:

```text
lexical_entries
      ↓
user_word_states
      ↓
srs_cards
      ↓
srs_reviews
```

Modelo inicial sugerido:

```text
srs_cards
├── id
├── userId
├── lexicalEntryId
├── box
├── dueAt
├── intervalDays
├── easeFactor
├── reviewCount
├── lapseCount
├── lastReviewedAt
└── createdAt
```

```text
srs_reviews
├── id
├── cardId
├── rating
├── previousBox
├── nextBox
├── previousDueAt
├── nextDueAt
└── reviewedAt
```

O motor implementado usa cinco caixas com intervalos iniciais progressivos:

```text
Caixa 1 → vencimento imediato ou reinício após esquecimento
Caixa 2 → 1 dia
Caixa 3 → 3 dias
Caixa 4 → 7 dias
Caixa 5 → 14 dias
```

Um MVP simples pode começar com cinco caixas:

```text
Caixa 1 → revisão frequente
Caixa 2 → intervalo curto
Caixa 3 → intervalo médio
Caixa 4 → intervalo longo
Caixa 5 → domínio
```

## Áudio atual

O aplicativo utiliza:

```text
expo-audio
expo-speech
expo-file-system
```

O comportamento atual é:

```text
Existe MP3 com URL e hash?
    ↓ sim → procurar no cache local e reproduzir

Não existe MP3 local?
    ↓
Download remoto e gravação em documentDirectory/audio

Não existe URL?
    ↓
Usar expo-speech como fallback
```

O serviço server-side suporta as variáveis:

```text
AZURE_SPEECH_KEY
AZURE_SPEECH_REGION
AUDIO_STORAGE_UPLOAD_URL_TEMPLATE
AUDIO_STORAGE_PUBLIC_URL_TEMPLATE
```

A geração Azure e o upload só funcionarão quando essas configurações forem fornecidas no ambiente do servidor. O aplicativo não deve receber a chave Azure.

## Importação e administração

O contrato de importação está em:

```text
server/domain/content-import.ts
```

A procedure administrativa é:

```text
adminContent.importDraft
```

Ela:

1. Exige utilizador administrador.
2. Valida a versão do documento.
3. Valida trilha, nós, etapas, vocabulário, atividades e missões.
4. Verifica IDs duplicados.
5. Verifica referências quebradas.
6. Guarda o documento em `content_imports` com estado `draft`.
7. É idempotente por trilha e versão.

A tabela de staging é:

```text
content_imports
```

Ainda falta criar a interface visual para colar ou carregar JSON, mostrar os erros, pré-visualizar o conteúdo e iniciar a publicação.

## Próxima ordem recomendada

### 1. Integrar revisão e Hoje

A próxima camada deve:

- Mostrar o número de revisões pendentes na tela Hoje.
- Levar o aluno diretamente para a sessão Revisar.
- Garantir a ativação automática de cartões ao entrar em `learning`.
- Exibir um resumo da sessão concluída no contexto diário.

### 2. Completar a área administrativa

Depois do ciclo de vocabulário e SRS estar estável, criar:

- Importador JSON visual.
- Editor de palavras.
- Editor de nós e missões.
- Estado da geração de áudio.
- Pré-visualização.
- Validação antes da publicação.

## Comandos de validação

Executar na raiz do projeto:

```bash
pnpm check
pnpm test
pnpm lint
git diff --check
```

O estado validado antes deste registo foi:

```text
TypeScript: OK
Testes: 27 passaram
Lint: OK
```

## Commits relevantes

- `6865d6e` — reprodução de áudio nas lições.
- `0a69252` — modelo `audio_assets` e contrato JSON de áudio.
- `9edd380` — cache local e preload de áudio.
- `ce1f660` — serviço server-side Azure Speech, upload e procedure administrativa.
- `5157a47` — importador JSON, validação e gravação de rascunhos.

## Regra de continuidade

A próxima implementação deve preservar a separação:

```text
conteúdo editorial ≠ estado pessoal ≠ agenda SRS
```

As palavras são definidas nas lições e nós. O vocabulário pessoal registra a relação do aluno com essas palavras. O SRS decide quando uma palavra deve ser revisada e como o desempenho altera o próximo intervalo.
