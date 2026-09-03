# Mapa de Mandarim

Aplicativo mobile first de aprendizado de mandarim organizado como uma jornada visual de competências. O usuário parte do que já conhece, explora palavras e estruturas, pratica em contexto, revisa com repetição espaçada e acompanha sua evolução em um mapa gamificado.

## Estado atual

A Etapa 1 foi concluída como fundação do projeto. O app já possui a tela Hoje personalizada, navegação inicial, componentes-base, identidade visual inicial, branding, autenticação preparada pelo scaffold e configuração migrada para Expo SDK 57.0.9.

As abas atuais são:

| Aba | Estado |
|---|---|
| Hoje | Tela inicial personalizada com próxima ação e progresso |
| Mapa | Estrutura inicial preparada para a trilha |
| Revisar | Espaço preparado para flashcards e SRS |
| Biblioteca | Espaço preparado para dicionário e palavras conhecidas |

## Escopo do MVP

A primeira versão validará uma única trilha: **Apresentações e informações pessoais**. O usuário deverá conseguir confirmar palavras conhecidas, seguir nós de aprendizagem, consultar o dicionário, completar uma etapa intermediária, revisar com flashcards, realizar uma missão curta e receber progresso visual e XP.

O MVP não inclui rede social, ranking, loja, economia virtual, múltiplas trilhas completas, leitor avançado, conversação livre, reconhecimento de voz ou IA generativa para criação de cursos.

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

A próxima fase é criar o modelo e o motor de **SRS**. A conclusão de atividades já atualiza o vocabulário pessoal e preserva o estado de cada palavra; agora o mapa deve alimentar cartões de revisão com agenda, histórico e avaliações de desempenho.
