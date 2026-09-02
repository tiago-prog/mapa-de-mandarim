# Arquitetura do Mapa de Mandarim

## Visão do produto

O Mapa de Mandarim é um aplicativo mobile first de aprendizado de mandarim organizado como uma jornada visual de competências. O usuário parte do que já conhece, explora palavras e estruturas, pratica em uma etapa intermediária, consolida com flashcards e visualiza seu avanço em um mapa gamificado.

O MVP será centrado em uma única trilha: **Apresentações e informações pessoais**. A primeira versão precisa provar o fluxo de aprendizagem, e não oferecer um curso completo.

## Princípios técnicos

A aplicação será um monólito modular. O mobile, a API e o domínio ficam no mesmo repositório, mas com responsabilidades separadas. Não serão utilizados microserviços, GraphQL, CMS separado, banco vetorial ou geração de conteúdo por IA no MVP.

As regras de aprendizagem não devem depender da interface. O mapa, os flashcards e uma futura versão desktop devem consumir o mesmo domínio, os mesmos contratos e o mesmo progresso.

## Stack

| Camada | Tecnologia | Papel |
|---|---|---|
| Mobile | Expo SDK 57.0.9, React Native, TypeScript | Aplicativo iOS/Android e futura adaptação web |
| Navegação | Expo Router 57 | Rotas e abas do aplicativo |
| UI | NativeWind, React Native, Reanimated | Estilos, componentes e microinterações |
| Dados remotos | TanStack Query | Cache, carregamento e invalidação |
| API | tRPC + Zod | Contratos tipados e validação |
| Backend | Node.js + TypeScript | Serviço da aplicação |
| Persistência | Drizzle ORM + MySQL/TiDB do scaffold | Dados sincronizados do usuário |
| Sessão | Manus OAuth no desenvolvimento | Autenticação inicial do MVP |
| Produção | Adaptador preparado para Google OAuth | Possível provedor principal futuro |
| Dados locais | AsyncStorage e fila pequena de eventos | Preferências, cache e respostas pendentes |
| Áudio | expo-audio | Pronúncia e atividades de escuta |
| Testes | TypeScript, lint, Vitest e testes de componentes | Proteção do domínio e dos fluxos críticos |

## Módulos de domínio

```text
server/
  routers/
    today.ts
    learningMap.ts
    lessons.ts
    review.ts
    dictionary.ts
    words.ts
    progression.ts
  domain/
    learningMap.ts
    mastery.ts
    spacedRepetition.ts
    missions.ts
    achievements.ts
  repositories/
    lexicalRepository.ts
    learningRepository.ts
    reviewRepository.ts
    progressionRepository.ts
```

Os routers validam entrada, autenticam o usuário e delegam para o domínio. O cálculo de domínio, próxima revisão, XP e desbloqueio deve ficar em funções puras e testáveis.

## Entidades do MVP

| Entidade | Responsabilidade |
|---|---|
| `lexicalEntries` | Dados estáveis de cada palavra ou expressão |
| `userWordStates` | Relação pessoal do usuário com cada entrada |
| `learningPaths` | Trilhas publicadas |
| `learningNodes` | Competências dentro de uma trilha |
| `nodeLexicalEntries` | Palavras relacionadas a um nó |
| `nodePrerequisites` | Dependências entre nós |
| `lessonActivities` | Atividades intermediárias |
| `missions` | Aplicações contextuais |
| `userNodeProgress` | Domínio e progresso do usuário em cada nó |
| `reviewCards` | Cartões e agenda SRS |
| `reviewEvents` | Histórico imutável de respostas |
| `achievements` | Conquistas disponíveis |
| `userAchievements` | Conquistas desbloqueadas |
| `userProgress` | XP, sequência e resumo de progresso |

Uma entrada lexical não é automaticamente conhecida. O estado do usuário, o histórico de revisão e o domínio do nó são informações distintas.

## Estados de conhecimento

```text
new          # ainda não explorada
exposed      # apresentada ao usuário
recognized   # reconhecida com apoio ou contexto
remembered   # recuperada em revisão
usable       # usada corretamente em atividade
known        # marcada manualmente como conhecida
```

A marcação `known` reduz a introdução básica, mas não impede atividades de confirmação e aplicação contextual.

## Autenticação

O MVP utilizará Manus OAuth porque o scaffold já fornece o fluxo inicial e permite testar o produto rapidamente. A aplicação deve usar um identificador interno de usuário, nunca o e-mail como chave principal.

```text
users
  id
  name
  email
  createdAt

authAccounts
  userId
  provider: manus | google
  providerAccountId
  metadata
```

A autenticação será encapsulada em um adaptador com operações `login`, `logout`, `getCurrentUser` e `refreshSession`. Isso permite validar Google OAuth posteriormente sem alterar as telas ou o domínio.

## Dados locais e sincronização

A estratégia inicial será online-first com tolerância a interrupções. O mapa e o dicionário podem ser armazenados em cache; preferências podem ser persistidas localmente; respostas de flashcards podem entrar em uma fila temporária; XP, sequência e domínio devem ser confirmados pelo servidor.

Cada resposta enviada pelo dispositivo deve possuir um `clientEventId` idempotente. Assim, uma nova tentativa de sincronização não registra a mesma revisão duas vezes.

Não será implementada sincronização offline completa no MVP. SQLite, resolução complexa de conflitos e edição offline de conteúdo ficam para uma fase posterior.

## API inicial

```text
 today.get
 learningMap.get
 learningMap.getNode
 learningMap.getRecommendedNext
 words.listMine
 words.setKnowledgeState
 dictionary.search
 dictionary.getEntry
 lesson.get
 lesson.submitActivity
 review.getDue
 review.submitRating
 mission.get
 mission.submitResult
 progression.getSummary
 progression.getAchievements
```

A resposta de `today.get` deve ser orientada à ação e já conter a recomendação principal, o nó atual, revisões pendentes, sequência e XP do dia.

## Reciclagem do Caderno de Mandarim

Serão aproveitados seletivamente os dados linguísticos, pinyin, tons, áudio quando compatível, regras SRS, histórico de avaliações e testes do motor de aprendizagem. Telas, schema inteiro, recursos sociais, leitor avançado e central editorial não serão copiados para o MVP.

A importação dos dados antigos deve ser feita por script reproduzível, mantendo versão e proveniência do dataset.

## Fora do MVP

Ficam explicitamente fora da primeira versão: múltiplas trilhas completas, rede social, ranking, loja, moedas, IA generativa de cursos, conversação aberta, reconhecimento de voz, leitor avançado, estatísticas complexas, economia virtual e desktop dedicado.
