# Mapa de Mandarim

Aplicativo mobile first de aprendizado de mandarim organizado como uma jornada visual de competências. O usuário parte do que já conhece, explora palavras e estruturas, pratica em contexto, revisa com repetição espaçada e acompanha sua evolução em um mapa gamificado.

## Estado atual

A fundação do projeto e o primeiro vertical slice pedagógico já estão implementados. O app possui a tela Hoje personalizada, mapa de progressão, nós, lições, atividades, missões, dicionário, estados pessoais de palavras, identidade visual inicial, autenticação preparada pelo scaffold e configuração migrada para Expo SDK 57.0.9.

As abas atuais são:

| Aba | Estado |
|---|---|
| Hoje | Tela inicial personalizada com próxima ação e progresso |
| Mapa | Trilha inicial com nós, desbloqueios e progresso real |
| Revisar | Sessão SRS funcional com fila, revelação, áudio e avaliações |
| Biblioteca | Dicionário funcional com estados `new`, `learning` e `known` |

## Escopo do MVP

A primeira versão validará uma única trilha: **Apresentações e informações pessoais**. O usuário deverá conseguir confirmar palavras conhecidas, seguir nós de aprendizagem, consultar o dicionário, completar uma etapa intermediária, revisar com flashcards, realizar uma missão curta e receber progresso visual e XP.

Ao praticar uma atividade, as palavras vinculadas ao nó entram automaticamente no vocabulário pessoal como `learning`, sem rebaixar uma palavra que o usuário marcou como `known`. O MVP não inclui rede social, ranking, loja, economia virtual, múltiplas trilhas completas, leitor avançado, conversação livre, reconhecimento de voz ou IA generativa para criação de cursos.

## Stack

- Expo SDK 57.0.9
- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3
- Expo Router 57
- NativeWind 4
- React Native Reanimated 4
- TanStack Query
- tRPC e Zod
- Drizzle ORM
- MySQL/TiDB conforme o scaffold
- Manus OAuth no desenvolvimento
- AsyncStorage para preferências, cache e fila inicial
- Vitest, TypeScript e Expo Lint

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Validações disponíveis:

```bash
pnpm check
pnpm lint
pnpm test
```

O comando `pnpm dev` inicia o servidor da API e o Metro/Expo web. Para testar em dispositivo, utilize o fluxo de QR Code do ambiente Expo.

## Estrutura principal

```text
app/
  (tabs)/
    index.tsx       # Hoje
    map.tsx         # Mapa
    review.tsx      # Revisar
    library.tsx     # Biblioteca
  node/[id].tsx     # Detalhe do nó
  lesson/[id].tsx   # Etapa intermediária

components/ui/      # Componentes reutilizáveis de interface
server/             # API e domínio futuro
shared/             # Tipos compartilhados
assets/images/      # Branding e imagens do app
docs/               # Decisões técnicas
design.md           # Plano de interface mobile first
todo.md             # Backlog do produto
```

## Identidade visual

A identidade aproveita a base do Caderno de Mandarim, com evolução para uma experiência mobile moderna:

| Token | Valor | Uso |
|---|---|---|
| Ink | `#172A35` | Texto e superfícies fortes |
| Seal | `#C8654A` | Ações e destaques principais |
| Sage | `#557B61` | Domínio e conclusão |
| Paper | `#FFFCF4` | Fundo principal |
| Sand | `#F5EEE0` | Superfícies secundárias |
| Gold | `#D7A84B` | XP e recompensas |

A tipografia de referência combina DM Serif Display para títulos, Noto Serif SC para hanzi, uma sans-serif legível para interface e JetBrains Mono para pinyin e dados técnicos.

## Documentação

- [`design.md`](./design.md): telas, fluxos, navegação e direção visual.
- [`docs/architecture.md`](./docs/architecture.md): arquitetura, domínio, autenticação, sincronização e API.
- [`todo.md`](./todo.md): backlog histórico e próximas etapas.

## Próxima etapa

O backend SRS já possui cartões, histórico, agenda de vencimento, motor de cinco caixas e avaliações idempotentes. A sessão visual da aba Revisar e o resumo de revisões pendentes na tela Hoje já estão implementados. A próxima fase é aplicar as migrações no staging, substituir o fallback de preview por dados reais e validar a persistência ponta a ponta.
