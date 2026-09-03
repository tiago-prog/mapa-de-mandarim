# Especificação de fechamento: nós e missões

## Objetivo

Esta especificação define o que precisa estar concluído para considerar a camada de **trilhas, nós, lições e missões** pronta para receber a integração completa do vocabulário pessoal e do SRS. O objetivo não é apenas terminar algumas telas. É deixar o conteúdo pedagógico estruturado, validado, persistente, importável e preparado para ser consumido por diferentes interfaces.

A decisão central é separar três responsabilidades:

```text
Autoria pedagógica
      ↓
Conteúdo publicado de nós e missões
      ↓
Percurso do aluno e progresso
      ↓
Vocabulário pessoal e SRS
```

A camada de nós e missões deve estar estável antes de o sistema começar a transformar palavras em itens pessoais do aluno.

## 1. Definição de pronto

A camada estará pronta quando for possível criar, validar, publicar e executar uma trilha completa sem alterar manualmente o código TypeScript. Um administrador deverá conseguir importar ou editar uma trilha contendo nós, etapas, missões, atividades e relações lexicais. Um aluno deverá conseguir percorrer apenas o conteúdo publicado, concluir atividades, finalizar missões e receber progresso consistente.

Os seguintes critérios são obrigatórios:

| Área | Critério de conclusão |
|---|---|
| Estrutura | Trilhas, nós, etapas, atividades e missões possuem IDs estáveis e relações explícitas |
| Pedagogia | Cada nó possui objetivo, contexto, vocabulário, gramática, prática, aplicação e revisão |
| Missão | Cada missão possui objetivo, contexto, sequência de turnos e critérios de conclusão |
| Conteúdo | Cada atividade possui tipo, instrução, resposta, dica e feedback válidos |
| Progressão | Pré-requisitos, desbloqueio e conclusão de nós funcionam sem inconsistências |
| Persistência | Progresso e conclusões são mantidos por usuário e são idempotentes |
| Autoria | Conteúdo pode ser criado ou importado como rascunho |
| Publicação | Conteúdo inválido não pode ser publicado |
| Pré-visualização | Administrador pode executar o percurso antes da publicação |
| Compatibilidade | API pública nunca expõe gabaritos antes da resposta |
| Testes | Fluxos de nó, missão, importação e publicação possuem testes automatizados |

## 2. Modelo pedagógico final de um nó

Um nó representa uma competência comunicativa pequena e observável. Ele não deve ser apenas um tema ou uma lista de palavras. Deve responder a uma pergunta concreta: **o que o aluno conseguirá fazer depois de concluir este nó?**

```text
Nó
├── Identidade e posição no mapa
├── Objetivo comunicativo
├── Pré-requisitos
├── Contexto inicial
├── Vocabulário ensinado
├── Explicação gramatical
├── Prática guiada
├── Missão ou aplicação
├── Critérios de domínio
└── Revisão pedagógica
```

Cada nó precisa ter:

- Um título curto.
- Uma descrição clara.
- Um objetivo comunicativo em linguagem de uso.
- Uma posição estável na trilha.
- Zero ou um pré-requisito inicial no MVP.
- Um conjunto ordenado de etapas.
- Um conjunto de palavras ensinadas.
- Pelo menos uma atividade de prática.
- Uma aplicação ou missão.
- Critérios de sucesso verificáveis.

O progresso do nó deve medir a conclusão das atividades essenciais. Ele não deve ser confundido com o domínio de todas as palavras ou com a agenda do SRS.

## 3. Sete etapas padrão

O formato padrão de cada nó será:

```text
1. Objetivo
2. Contexto
3. Vocabulário
4. Gramática
5. Prática guiada
6. Aplicação ou missão
7. Revisão
```

### Objetivo

Explica o que o aluno vai conseguir fazer, apresenta critérios de sucesso e informa uma estimativa de duração.

### Contexto

Apresenta uma conversa curta com personagens, hanzi, pinyin e tradução revelável. O contexto deve introduzir a intenção comunicativa antes da explicação formal.

### Vocabulário

Apresenta as entradas lexicais selecionadas para aquele nó, com significado e exemplos. A integração com `userWordStates` será feita posteriormente, mas a associação de conteúdo deve estar explícita desde já.

### Gramática

Explica apenas os padrões necessários para cumprir o objetivo. Cada padrão deve possuir uma forma, uma explicação de uso e um exemplo contextualizado.

### Prática guiada

Usa atividades de reconhecimento, ordenação, preenchimento ou escolha. A prática deve oferecer feedback imediato e permitir nova tentativa sem corromper o progresso.

### Aplicação ou missão

Coloca o aluno numa situação comunicativa. A aplicação de um nó simples pode ter uma atividade. A aplicação de um nó final ou de maior complexidade deve ser uma missão composta por vários turnos.

### Revisão

Resume a competência e os principais padrões. Esta etapa não é a revisão SRS. A revisão SRS será construída sobre o vocabulário pessoal depois de a camada de conteúdo estar estabilizada.

## 4. Modelo final de missão

Uma missão é uma aplicação contextual com uma sequência ordenada de decisões do aluno. Ela não deve ser representada apenas como um título ou como uma atividade isolada.

```text
Missão
├── Identidade
├── Objetivo comunicativo
├── Contexto e situação
├── Personagens
├── Critério de sucesso
├── Turnos ordenados
│   ├── Fala anterior ou situação
│   ├── Prompt do aluno
│   ├── Atividade
│   ├── Resposta correta
│   ├── Feedback
│   └── Palavras utilizadas
└── Resultado final
```

Cada missão deve ter:

- Um objetivo diferente de apenas “responder corretamente”.
- Um contexto que explique quem fala e por quê.
- Uma sequência determinística de turnos.
- Pelo menos uma decisão por turno.
- Uma resposta correta e alternativas plausíveis.
- Feedback local para cada erro.
- Um resultado final que explique a competência demonstrada.
- Uma relação explícita com as palavras e estruturas usadas.

A missão pode reutilizar os tipos de atividade existentes, mas a sequência deve pertencer a uma missão identificável. No estado atual, o diálogo final é representado por atividades dentro da etapa `application`. Essa representação é funcional para o vertical slice, mas deve ser migrada para entidades `missions` e `mission_steps` quando o editor administrativo for implementado.

## 5. Modelo de dados alvo

O modelo alvo aproveita as entidades atuais e acrescenta relações e publicação explícitas.

| Entidade | Responsabilidade |
|---|---|
| `learning_paths` | Trilhas e metadados de percurso |
| `learning_nodes` | Competências e relações de pré-requisito |
| `learning_node_steps` | Sete etapas ordenadas de cada nó |
| `lesson_activities` | Atividades de prática e aplicação |
| `missions` | Metadados das aplicações contextuais |
| `mission_steps` | Turnos ordenados da missão |
| `lexical_entries` | Catálogo global de palavras e expressões |
| `node_lexical_entries` | Vocabulário ensinado por nó |
| `activity_lexical_entries` | Palavras usadas por atividade |
| `user_node_progress` | Progresso do aluno no nó |
| `activity_completions` | Conclusões idempotentes de atividades |
| `content_releases` | Estado e versão editorial |

As tabelas de conteúdo não devem guardar progresso pessoal. Uma importação nunca pode sobrescrever XP, conclusões, estados de palavras ou revisões.

### Relações obrigatórias

```text
learning_paths 1 ── N learning_nodes
learning_nodes 1 ── N learning_node_steps
learning_nodes 1 ── N lesson_activities
learning_nodes 1 ── N missions
missions 1 ── N mission_steps
lesson_activities N ── N lexical_entries
learning_nodes N ── N lexical_entries
```

A tabela `activity_lexical_entries` é especialmente importante. O sistema não deve descobrir palavras comparando texto livre. O autor deve indicar quais entradas são alvo, suporte ou contexto em cada atividade.

## 6. Formato JSON canónico de importação

O JSON deve ser orientado ao autor, versionado e independente dos nomes internos das tabelas SQL. Um documento pode conter uma trilha inteira ou apenas um conjunto de nós.

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026.09.03",
  "source": {
    "name": "Mapa de Mandarim",
    "author": "Tiago"
  },
  "path": {
    "id": "presentations",
    "slug": "apresentacoes-e-informacoes-pessoais",
    "title": "Apresentações e informações pessoais",
    "description": "Construa as primeiras frases.",
    "status": "draft",
    "nodes": []
  }
}
```

Cada nó deve conter `id`, `slug`, `orderIndex`, `objective`, `prerequisiteNodeId`, `vocabulary`, `steps` e, quando necessário, `mission`.

Cada palavra pode ser uma referência:

```json
{ "lexicalEntryId": "shenme" }
```

ou uma definição embutida para uma nova entrada editorial:

```json
{
  "id": "shenme",
  "hanzi": "什么",
  "pinyin": "shénme",
  "meaningPtBr": "o que; qual",
  "exampleHanzi": "你叫什么名字？",
  "examplePtBr": "Como você se chama?"
}
```

A importação deve aceitar os dois formatos, mas nunca deve criar duplicatas no catálogo global.

## 7. Importação, validação e publicação

O fluxo editorial oficial será:

```text
Upload JSON
   ↓
Validação estrutural
   ↓
Validação pedagógica
   ↓
Pré-visualização das alterações
   ↓
Importação como draft
   ↓
Revisão administrativa
   ↓
Publicação
```

A validação estrutural verifica a versão, os tipos, os campos obrigatórios, os IDs duplicados e os tipos de atividade suportados.

A validação pedagógica verifica objetivos, etapas, pré-requisitos, ciclos, atividades, respostas, referências lexicais e missões completas.

A pré-visualização deve informar:

- Entidades novas.
- Entidades atualizadas.
- Palavras novas.
- Palavras já existentes.
- Avisos não bloqueantes.
- Erros que impedem a importação.

A importação deve ser idempotente. Reimportar o mesmo documento deve atualizar as entidades pelos seus IDs estáveis, e não criar cópias.

Nenhum conteúdo em `draft` deve aparecer para alunos. O estado `published` deve ser uma decisão explícita do administrador.

## 8. Fluxo do aluno

O fluxo final de um aluno deve ser:

```text
Hoje
  ↓
Mapa
  ↓
Nó desbloqueado
  ↓
Detalhe do nó
  ↓
Objetivo
  ↓
Contexto
  ↓
Vocabulário
  ↓
Gramática
  ↓
Prática
  ↓
Missão ou aplicação
  ↓
Resultado
  ↓
Revisão pedagógica
  ↓
Nó concluído
```

A interface deve garantir que o aluno compreenda:

- Onde está no nó.
- Qual é o objetivo.
- Quantas etapas faltam.
- Qual atividade está respondendo.
- Por que uma resposta está correta ou incorreta.
- O que foi concluído.
- Qual nó será desbloqueado depois.

A missão deve mostrar o contexto suficiente para que o aluno escolha uma fala comunicativamente adequada. Não deve ser apenas uma sequência de perguntas sem continuidade.

## 9. Regras de progresso

O progresso deve ser calculado no domínio e não na interface.

Uma atividade correta pode ser concluída. Uma atividade incorreta deve gerar feedback, mas não deve avançar a lista de conclusões essenciais. A repetição do mesmo `clientEventId` deve devolver o resultado original sem duplicar XP ou progresso.

Um nó pode ser considerado concluído quando todas as atividades essenciais estiverem concluídas. Uma missão composta por vários turnos deve ser concluída apenas quando todos os seus turnos essenciais forem concluídos.

O desbloqueio deve verificar o pré-requisito diretamente no domínio. A interface apenas apresenta o estado devolvido pela API.

A conclusão do nó não deve, por si só, significar que todas as palavras foram dominadas. Ela apenas fornece evidência de que o aluno concluiu aquela competência.

## 10. Área administrativa mínima

A primeira versão administrativa deve priorizar autoria correta em vez de complexidade visual.

### Trilha

- Listar trilhas.
- Criar e editar título, slug, descrição e estado.
- Importar e exportar JSON.
- Validar e publicar.

### Nó

- Criar e editar objetivo, descrição, ordem e pré-requisito.
- Associar palavras.
- Editar as sete etapas.
- Criar atividades.
- Criar ou associar missão.
- Pré-visualizar o percurso.

### Missão

- Criar contexto e objetivo.
- Adicionar turnos ordenados.
- Escolher tipo de atividade por turno.
- Associar palavras usadas.
- Definir respostas e distratores.
- Configurar feedback.
- Testar a missão antes da publicação.

Drag-and-drop, colaboração entre vários autores e histórico avançado podem ficar para depois. A primeira versão pode usar formulários ordenados com botões para mover uma etapa para cima ou para baixo.

## 11. Plano técnico de fechamento

### Marco 1 — Contrato de conteúdo

Criar tipos TypeScript para o JSON canónico, adicionar `schemaVersion`, definir os campos obrigatórios e escrever validações com Zod. Este marco não altera o comportamento do aluno.

### Marco 2 — Relações lexicais explícitas

Adicionar `activityLexicalEntries` e garantir que toda atividade e missão declare as entradas que utiliza. Os seeds atuais devem ser convertidos para usar essas relações.

### Marco 3 — Entidades de missão

Criar `missions` e `mission_steps`, migrar o diálogo final para essas entidades e manter compatibilidade com a API atual durante a transição.

### Marco 4 — Estados editoriais

Adicionar `draft`, `review`, `published` e `archived`. Atualizar as queries públicas para devolver apenas conteúdo publicado.

### Marco 5 — Importador e exportador

Implementar validação, pré-visualização, importação idempotente e exportação no mesmo formato canónico.

### Marco 6 — Administração mínima

Criar a área protegida por `role = admin` para gerir trilhas, nós, etapas, atividades e missões.

### Marco 7 — Validação ponta a ponta

Testar importação, publicação, execução do nó, execução da missão, conclusão, desbloqueio, reimportação e proteção dos gabaritos.

Depois desses marcos, a camada de nós e missões estará pronta para a integração do vocabulário pessoal e do SRS.

## 12. O que fica deliberadamente para a etapa seguinte

A integração seguinte deve começar somente depois dos critérios acima serem atendidos. Ela incluirá:

- Criação automática de `userWordStates` ao concluir etapas ou atividades.
- Estados pedagógicos pessoais.
- Cartões SRS.
- Agenda e caixas.
- Histórico de revisões.
- Aba Revisar.
- Indicadores de revisão na tela Hoje.

Esses dados são do aluno e não devem ser incluídos no JSON editorial de uma lição.

## 13. Decisões finais

O nó é a unidade de competência. A missão é a unidade de aplicação contextual. A lição é a sequência pedagógica que prepara o aluno para a aplicação. A palavra é uma entrada lexical global que pode aparecer em muitos nós. O vocabulário pessoal será uma relação criada durante o percurso do aluno. O SRS será uma camada posterior que agenda a retenção dessas palavras.

O conteúdo deve ser criado num formato JSON versionado, importado como rascunho, validado, pré-visualizado e publicado. Os IDs estáveis devem garantir importação idempotente. As relações entre atividades, missões e palavras devem ser explícitas. O progresso do aluno deve ficar separado do conteúdo editorial.

A ordem correta de trabalho é:

```text
Fechar contrato de conteúdo
      ↓
Fechar relações de nós e missões
      ↓
Fechar importação e publicação
      ↓
Validar percurso completo do aluno
      ↓
Ligar palavras ao vocabulário pessoal
      ↓
Construir SRS e flashcards
```

## Referências

[1]: ./learning-vocabulary-srs-admin-analysis.md "Análise consolidada de lições, vocabulário, SRS e autoria administrativa"

[2]: ../server/domain/learning.ts "Domínio atual de trilhas, nós, etapas e atividades"

[3]: ../drizzle/schema.ts "Schema atual do Mapa de Mandarim"
