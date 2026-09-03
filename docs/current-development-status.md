# Estado atual do desenvolvimento — Mapa de Mandarim

**Data do registo:** 2026-09-03  
**Objetivo:** entregar um ponto de continuidade claro para a próxima IA ou pessoa que assumir o desenvolvimento.

## Resumo executivo

O Mapa de Mandarim já possui uma base funcional de aprendizagem móvel: mapa de progressão, nós, lições, atividades, missões e vocabulário inicial. A infraestrutura inicial de áudio também foi preparada, incluindo reprodução mobile, fallback TTS, cache local, modelo de assets e serviço server-side para futura geração neural.

A integração entre **lição e vocabulário pessoal** já está implementada. Ao submeter uma atividade, o sistema registra a exposição das palavras do nó, cria ou atualiza `user_word_states`, atualiza `lastSeenAt` e preserva o estado `known`. A principal lacuna funcional neste momento é o ciclo de **SRS e revisão**: cartões, agenda e histórico ainda não foram implementados.

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
| Estados pessoais | `user_word_states` com estados `new`, `learning` e `known` |
| Integração lição → vocabulário | Funcional, idempotente e persistida com fallback em memória |
| Pesquisa de dicionário | Funcional |
| Áudio mobile | `AudioButton` com `expo-audio` |
| Fallback de pronúncia | `expo-speech` |
| Cache local | Cache persistente por hash em `documentDirectory/audio` |
| Preload | Preload progressivo de URLs de áudio encontradas no payload da lição |
| Modelo de áudio | `audio_assets` com hash, metadados, estados e URL |
| Azure Speech | Serviço server-side implementado, dependente de configuração |
| Importação JSON | Contrato, validação e gravação de rascunhos implementados |
| Área administrativa visual | Ainda não implementada |
| Flashcards | Ainda não implementados |
| SRS | Ainda não implementado |

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

### Integração implementada

Ao submeter uma atividade, o sistema agora executa de forma idempotente:

```text
identificar palavras associadas explicitamente ao nó
      ↓
criar ou atualizar user_word_states
      ↓
atualizar lastSeenAt
      ↓
marcar exposição como learning, preservando known
```

A integração ocorre na mesma transação de progresso e conclusão da atividade quando há banco. No preview sem banco, o dicionário e as lições compartilham o mesmo estado em memória. A conclusão de uma lição **não marca automaticamente uma palavra como `known`**: exposição e domínio continuam sendo conceitos diferentes.

## SRS ainda pendente

Ainda não existem:

- Tabela de cartões.
- Agenda `dueAt` ou `nextReviewAt`.
- Histórico de revisões.
- Sistema de caixas.
- Intervalos de revisão.
- Avaliações como “errei”, “difícil”, “bom” e “fácil”.
- Tela Revisar funcional.
- Criação ou ativação automática de cartões.

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

### 1. Integrar lição com vocabulário pessoal — concluído

A função de domínio e o fluxo de persistência já fazem upsert idempotente em `user_word_states`, preservam `known`, atualizam `lastSeenAt` e funcionam no fallback em memória. A cobertura inclui palavras novas, palavras conhecidas e o percurso real de uma lição.

### 2. Criar o modelo SRS — próximo marco

Adicionar migrações e tipos para `srs_cards` e `srs_reviews`. O SRS deve referenciar `lexicalEntryId`, nunca duplicar Hanzi, pinyin ou significados.

### 3. Criar o motor SRS

Implementar uma política simples, determinística e testável para:

```text
rating → próxima caixa → próximo intervalo → dueAt
```

A função deve ser pura antes de ser ligada ao banco.

### 4. Criar a aba Revisar

A tela deve:

- Consultar cartões vencidos.
- Mostrar o prompt de forma progressiva.
- Revelar resposta e significado.
- Reproduzir áudio.
- Receber a avaliação.
- Persistir o histórico.
- Atualizar o próximo vencimento.

### 5. Completar a área administrativa

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
Testes: 20 passaram
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
