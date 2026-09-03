# Análise consolidada: lições, vocabulário, SRS e autoria administrativa

## Conclusão executiva

O projeto deve tratar **conteúdo pedagógico**, **vocabulário pessoal** e **revisão espaçada** como camadas relacionadas, mas distintas. As lições e missões introduzem palavras e dão contexto ao seu uso. O vocabulário pessoal registra que essas palavras passaram a fazer parte da experiência individual do aluno. O Sistema de Repetição Espaçada (SRS) consulta esse vocabulário e agenda revisões. O flashcard é apenas a interface usada durante uma revisão; ele não deve ser a origem da palavra nem substituir o estado pedagógico do aluno.

Esta separação também define a futura área administrativa. O administrador cria nós, missões, etapas, atividades e associações lexicais. O aluno percorre esse conteúdo. Ao concluir ou praticar uma lição, o backend materializa as palavras no vocabulário pessoal do aluno. Mais tarde, o SRS seleciona as palavras elegíveis e cria ou atualiza os cartões de revisão.

A base atual já possui uma boa parte do conteúdo necessário para o primeiro vertical slice, mas ainda mistura algumas responsabilidades no modelo de domínio e não atualiza automaticamente o vocabulário pessoal quando uma lição é concluída. A próxima evolução deve corrigir essa ligação antes de construir a aba de revisão.

## 1. Estado atual do projeto

O Mapa de Mandarim já possui uma trilha inicial com cinco nós, sete etapas por nó, atividades de múltipla escolha, ordenação, escolha contextual e preenchimento de lacuna. Cada nó possui uma lista estável de entradas lexicais associadas, e a etapa de vocabulário exibe essas entradas com hanzi, pinyin, significado e exemplo. O progresso das atividades é persistido por usuário, com suporte a XP, conclusão de nó e idempotência por `clientEventId`.[1]

O dicionário global está representado por `lexicalEntries`. A relação entre um nó e as palavras que ele ensina está representada por `nodeLexicalEntries`. A relação entre um usuário e uma palavra está representada por `userWordStates`, que atualmente possui os estados `new`, `known` e `learning`.[2]

A alteração de `userWordStates` ainda é manual. O usuário pode abrir uma palavra na Biblioteca e marcar o estado. A conclusão de uma atividade atualiza o progresso do nó e o XP, mas não garante que as palavras do nó existam no vocabulário pessoal do usuário. Também não existe ainda um cartão SRS separado, uma agenda de revisão ou um histórico de avaliações no Mapa de Mandarim. A aba Revisar permanece como ponto de integração futuro.[3]

O `caderno-de-mandarim` fornece uma referência funcional relevante. Nesse projeto, a palavra pessoal nasce na tabela `words` com `box = 1` e `nextReviewAt` igual ao momento de criação. As avaliações posteriores atualizam a caixa, a próxima revisão e o histórico em `reviews`. O motor utiliza as avaliações `forgot`, `hard` e `easy` para recalcular o intervalo.[4]

## 2. Modelo conceitual correto

A unidade fundamental do conteúdo é a **entrada lexical global**. Ela representa uma palavra ou expressão que pode ser usada em várias trilhas, nós e missões.

A unidade pessoal é o **estado da palavra para um usuário**. Esse registro responde à pergunta: “Esta palavra já faz parte do vocabulário deste usuário e qual é a sua situação pedagógica?”.

A unidade de retenção é o **cartão SRS**. Esse registro responde à pergunta: “Quando esta palavra deve ser revisada e como está evoluindo a sua retenção?”.

A unidade de auditoria é o **evento de revisão**. Esse registro responde à pergunta: “O que o usuário respondeu, quando respondeu e como essa resposta alterou a agenda?”.

A relação deve ser modelada desta forma:

```text
lexicalEntries
      ↓ associação de conteúdo
nó / missão / atividade
      ↓ apresentação e prática
userWordStates
      ↓ palavras elegíveis para retenção
reviewCards
      ↓ respostas do aluno
reviewEvents
```

Uma palavra pode existir em `userWordStates` sem ainda ter um cartão SRS. Isso é importante porque **aprender uma palavra** e **agendar uma revisão** são eventos diferentes. O sistema pode criar o estado pessoal assim que a palavra é apresentada, enquanto o cartão pode ser criado na primeira entrada na fila de revisão ou quando a palavra atinge o estado `learning`.

## 3. Ciclo de vida de uma palavra

O ciclo recomendado é o seguinte:

| Momento | Operação | Estado pessoal | SRS |
|---|---|---|---|
| A palavra está apenas no dicionário global | Nenhuma ação pessoal | Não existe registro | Não existe cartão |
| A palavra é apresentada numa etapa de vocabulário | Criar estado pessoal, se necessário | `new` ou `learning`, conforme a regra escolhida | Ainda não obrigatório |
| O usuário conclui uma atividade que usa a palavra | Atualizar `lastSeenAt` e o nível de exposição | `learning`, sem regredir `known` | Cartão pode ser criado ou ficar elegível |
| A palavra é usada corretamente numa aplicação | Registrar evidência de uso | `learning` ou estado de domínio intermediário | Cartão elegível para revisão |
| O usuário marca a palavra manualmente como conhecida | Preservar a escolha explícita | `known` | Cartão pode continuar existindo |
| O usuário avalia um flashcard | Registrar evento e recalcular agenda | Estado pode avançar ou regredir conforme a política | Atualizar caixa e `nextReviewAt` |

A recomendação para o primeiro modelo é manter os estados visíveis simples, para não quebrar a interface atual:

```text
new       # palavra já disponível, mas ainda não trabalhada
learning  # palavra apresentada ou praticada no percurso
known     # palavra marcada explicitamente como conhecida
```

Internamente, o sistema pode guardar evidências mais detalhadas, como `exposureCount`, `successfulActivityCount` e `successfulReviewCount`, sem obrigar a interface a exibir cinco ou seis estados. Se for necessário representar uma progressão mais rica no futuro, ela pode ser derivada desses eventos.

## 4. Regra de atualização ao concluir uma lição

A conclusão de uma atividade deve atualizar o vocabulário, mas não deve transformar automaticamente todas as palavras em conhecidas. A regra recomendada é idempotente e não destrutiva:

```text
para cada entrada lexical associada ao nó:
    se ainda não existe userWordState:
        criar com status = learning e lastSeenAt = agora
    senão:
        atualizar lastSeenAt
        preservar status = known quando ele já existir

para cada palavra explicitamente usada na atividade:
    registrar uma evidência de exposição ou uso
```

A operação deve ocorrer no servidor, na mesma transação lógica que confirma a conclusão da atividade quando houver banco de dados. Em caso de repetição do mesmo `clientEventId`, a operação não pode criar XP, progresso ou eventos duplicados.

A decisão mais segura é criar os estados quando o aluno **conclui a etapa de vocabulário** ou quando conclui a **primeira atividade que usa a palavra**. Dessa forma, apenas abrir um nó não enche o vocabulário pessoal com palavras que o usuário ainda não estudou. A regra pode ser configurada por produto, mas deve ser única e explícita.

Para a primeira versão, recomendo esta política:

- Ao concluir uma etapa de vocabulário, criar todos os estados das palavras do nó como `learning`.
- Ao concluir uma atividade, atualizar `lastSeenAt` das palavras relacionadas.
- Nunca alterar `known` para `learning` automaticamente.
- Não apagar palavras do vocabulário quando o usuário reinicia ou repete um nó.
- Permitir que o usuário volte manualmente uma palavra para `new` apenas como ação explícita.

## 5. Associação entre conteúdo e vocabulário

Hoje o nó já possui uma associação lexical. Isso é suficiente para o primeiro passo, mas as atividades precisam de uma associação mais precisa quando uma missão utiliza apenas parte do vocabulário do nó.

A associação recomendada é:

| Entidade | Relação |
|---|---|
| Nó | Possui um conjunto de palavras ensinadas |
| Etapa de vocabulário | Apresenta um subconjunto ordenado |
| Atividade | Usa um subconjunto de palavras |
| Missão | Usa palavras em uma sequência contextual |
| Estado pessoal | Registra a relação do usuário com cada entrada |

No modelo atual, `learningNodeSteps.contentJson` contém os IDs da etapa de vocabulário e `lessonActivities` contém o texto da atividade. A próxima migração deve adicionar uma tabela explícita, por exemplo `activityLexicalEntries`, para que o backend não tenha de inferir palavras procurando texto em hanzi ou pinyin.

```text
activityLexicalEntries
├── activityId
├── lexicalEntryId
├── role: target | support | context
└── orderIndex
```

A mesma estrutura pode ser reutilizada para missões. Assim, o administrador escolhe as palavras usadas numa atividade através de uma interface, e o sistema sabe exatamente quais estados atualizar.

## 6. Modelo SRS inspirado no Caderno de Mandarim

O motor do `caderno-de-mandarim` é uma boa base para o primeiro SRS. Ele utiliza intervalos simples e caixas derivadas do número de dias. A política observada é:

| Avaliação | Efeito inicial |
|---|---|
| `forgot` | Intervalo de um dia e caixa inicial |
| `hard` | Redução do intervalo atual |
| `easy` | Multiplicação do intervalo, com limite superior |

No Mapa de Mandarim, eu manteria o mesmo princípio, mas separaria o cartão da entrada lexical:

```text
reviewCards
├── id
├── userId
├── lexicalEntryId
├── box
├── nextReviewAt
├── lastReviewedAt
├── reviewCount
├── lapseCount
├── createdAt
└── updatedAt
```

O histórico deve ser imutável:

```text
reviewEvents
├── id
├── clientEventId
├── userId
├── cardId
├── rating
├── previousBox
├── nextBox
├── previousNextReviewAt
├── nextReviewAt
└── reviewedAt
```

A garantia única de `clientEventId` deve ser mantida para impedir duplicação quando uma resposta for reenviada pelo dispositivo.

O cartão não deve substituir `userWordStates`. A avaliação do SRS pode atualizar o estado pessoal através de regras explícitas, mas o cartão continua sendo uma agenda de retenção. Por exemplo, duas avaliações fáceis não devem apagar o fato de que uma palavra foi marcada manualmente como conhecida.

## 7. Área administrativa e autoria pedagógica

A área administrativa deve ser tratada como um **editor de conteúdo pedagógico**, não apenas como um CRUD genérico. O administrador precisa criar uma unidade completa e coerente:

```text
Trilha
 └── Nó
      ├── Objetivo
      ├── Contexto
      ├── Vocabulário
      ├── Gramática
      ├── Prática
      ├── Aplicação ou missão
      └── Revisão
```

Ao criar uma palavra dentro de um nó ou missão, o administrador deve poder:

- Selecionar uma entrada lexical existente.
- Criar uma nova entrada lexical quando tiver permissão editorial.
- Informar hanzi, pinyin, significado e exemplos.
- Associar áudio quando disponível.
- Definir se a palavra é alvo, suporte ou contexto.
- Ver onde a palavra já aparece noutras trilhas.
- Pré-visualizar como ela aparecerá no dicionário do aluno.

Ao criar uma atividade, o administrador deve poder escolher o tipo, escrever instruções, indicar a resposta correta, adicionar distratores, inserir dica e configurar feedback. O sistema deve impedir a publicação quando a atividade não possuir uma resposta válida ou quando uma palavra associada não existir.

Uma missão final deve ser criada como uma sequência ordenada de turnos. Cada turno precisa apontar para as entradas lexicais que estão sendo praticadas. A missão não deve depender de texto livre armazenado sem relações estruturadas.

## 8. Rascunho, revisão e publicação

O conteúdo administrativo precisa de estados de publicação. Editar conteúdo publicado diretamente cria risco de alterar a experiência de alunos que já começaram um nó.

A política recomendada é:

| Estado | Disponibilidade |
|---|---|
| `draft` | Somente administradores e pré-visualização |
| `review` | Administradores e revisores pedagógicos |
| `published` | Usuários elegíveis |
| `archived` | Não aparece em novas jornadas; histórico preservado |

Para o MVP administrativo, os estados podem ser adicionados diretamente a trilhas, nós, etapas e missões. Numa fase posterior, o sistema pode adotar versões imutáveis de conteúdo publicado. Essa segunda opção é mais segura quando o curso crescer.

Antes da publicação, o backend deve validar:

- IDs únicos e nomes obrigatórios.
- Ordem sem duplicações.
- Pré-requisitos existentes.
- Ausência de ciclos no grafo de nós.
- Pelo menos uma atividade em cada etapa prática.
- Resposta correta válida para cada atividade.
- Entradas lexicais existentes.
- Missões com sequência não vazia.
- Traduções e feedbacks preenchidos.
- Compatibilidade entre o tipo da atividade e seus campos.

## 9. Arquitetura de dados recomendada

A evolução pode ser feita sem apagar o modelo atual. As entidades abaixo aproveitam as tabelas existentes e adicionam apenas o que falta:

| Tabela | Papel |
|---|---|
| `lexicalEntries` | Catálogo global de palavras e expressões |
| `nodeLexicalEntries` | Vocabulário ensinado por cada nó |
| `activityLexicalEntries` | Palavras usadas por cada atividade |
| `userWordStates` | Estado pessoal e exposição do usuário |
| `reviewCards` | Agenda SRS por usuário e palavra |
| `reviewEvents` | Histórico das avaliações |
| `missions` | Metadados da aplicação contextual |
| `missionSteps` | Turnos ordenados de uma missão |
| `contentStatus` ou campos de publicação | Rascunho, revisão e publicação |

A tabela atual `lessonActivities` pode continuar sendo usada para as atividades do percurso. A missão pode inicialmente ser representada por um conjunto de atividades dentro da etapa `application`, como já acontece com o diálogo final implementado. Quando o editor administrativo for criado, vale introduzir `missions` e `missionSteps` para que o conceito fique explícito e possa ser reutilizado em diferentes nós.

## 10. API e responsabilidades

Os routers devem permanecer finos. Eles validam autenticação e entrada, enquanto o domínio decide a transição de estados.

### APIs do aluno

```text
lesson.get
lesson.submitActivity
vocabulary.listMine
vocabulary.get
vocabulary.setStatus
review.getDue
review.submitRating
mission.get
mission.submitResult
```

`lesson.submitActivity` deve devolver o resultado da atividade e, quando aplicável, um resumo das palavras atualizadas. `review.getDue` deve consultar cartões derivados do vocabulário pessoal. `review.submitRating` deve atualizar o cartão, criar o evento e recalcular o estado da palavra apenas de acordo com uma política definida.

### APIs administrativas

```text
admin.paths.list
admin.paths.create
admin.paths.update
admin.nodes.create
admin.nodes.update
admin.nodes.reorder
admin.nodes.publish
admin.steps.create
admin.steps.update
admin.activities.create
admin.activities.update
admin.missions.create
admin.missions.update
admin.content.validate
admin.content.preview
```

Todas as procedures administrativas devem exigir `ctx.user.role === "admin"`. A autorização deve estar no servidor e não apenas escondida na interface.

## 11. Ordem de implementação recomendada

### Fase 1 — Vocabulário pessoal ligado às lições

Criar uma função de domínio idempotente para garantir estados de palavras. Associar atividades e etapas às entradas lexicais. Atualizar `userWordStates` ao concluir vocabulário ou atividades. Expor os estados atualizados na Biblioteca. Esta fase deve acontecer antes da aba Revisar.

### Fase 2 — SRS independente

Criar `reviewCards` e `reviewEvents`. Adaptar o motor de caixas e intervalos do Caderno para funções puras no novo domínio. Criar a fila de cartões elegíveis. Testar avaliações e idempotência.

### Fase 3 — Aba Revisar

Criar o fluxo de flashcard, revelação de resposta e avaliações `Esqueci`, `Difícil` e `Fácil`. A tela deve consumir apenas a API de revisão e não manipular diretamente estados pedagógicos.

### Fase 4 — Editor administrativo mínimo

Criar CRUD protegido para trilhas, nós, etapas, atividades e associações de vocabulário. Adicionar pré-visualização e publicação de um nó. O editor deve começar por formulários lineares, sem depender de drag-and-drop.

### Fase 5 — Editor de missões e publicação versionada

Adicionar criação de missões em sequência, validação pedagógica, duplicação de conteúdo, histórico e versões publicadas. Nesta fase, o administrador poderá produzir novas fases sem editar TypeScript.

## 12. Decisões que devem ser mantidas

A palavra deve ser criada no vocabulário pessoal antes de ser transformada em flashcard. A conclusão de uma lição não deve equivaler a domínio completo. O estado `known` não deve ser rebaixado automaticamente. O SRS deve alterar a agenda e registrar histórico, sem apagar o contexto pedagógico. As relações entre conteúdo e palavras devem ser explícitas por IDs, nunca inferidas pela comparação de textos. O administrador deve publicar conteúdo validado, e o aluno deve consumir apenas conteúdo publicado.

## 13. Resultado esperado

Com esse desenho, uma nova missão criada pelo administrador terá o seguinte efeito:

```text
Administrador cria missão
      ↓
Seleciona nós, etapas, atividades e palavras
      ↓
Publica conteúdo validado
      ↓
Aluno realiza a missão
      ↓
Palavras entram no vocabulário pessoal
      ↓
Estados são criados ou atualizados
      ↓
SRS seleciona palavras elegíveis
      ↓
Flashcards são apresentados
      ↓
Avaliações alteram caixas, datas e histórico
```

Essa arquitetura mantém as responsabilidades claras e permite que o projeto cresça de uma trilha fixa para uma plataforma de autoria pedagógica sem perder a separação entre conteúdo, aprendizagem e retenção.

## Referências

[1]: ../server/domain/learning.ts "Domínio atual de trilhas, nós, atividades e progresso do Mapa de Mandarim"

[2]: ../drizzle/schema.ts "Schema atual de entradas lexicais e estados pessoais do Mapa de Mandarim"

[3]: ../app/(tabs)/review.tsx "Tela atual de Revisar do Mapa de Mandarim"

[4]: ../../caderno-de-mandarim/server/learningEngine.ts "Motor SRS e cálculo de caixas do Caderno de Mandarim"
