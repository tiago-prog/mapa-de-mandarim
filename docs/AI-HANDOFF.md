# AI Handoff — Mapa de Mandarim

**Data da atualização:** 2026-09-02  
**Projeto:** `tiago-prog/mapa-de-mandarim`  
**Branch:** `main`  
**Estado:** Etapa 1 concluída; próxima prioridade: P0 da tela Hoje e domínio da primeira trilha.

## 1. Contexto do produto

O Mapa de Mandarim é um aplicativo mobile first de aprendizado de mandarim. A experiência deve ser pensada primeiro para telas portrait, toque, uso com uma mão e sessões curtas. O produto combina um mapa visual de competências, palavras conhecidas, dicionário contextual, uma etapa intermediária de aprendizagem, flashcards com repetição espaçada e gamificação leve.

O mapa é o centro pedagógico. O dicionário fornece dados linguísticos; o estado pessoal das palavras representa o conhecimento do usuário; os flashcards consolidam a memória; as missões demonstram aplicação; e XP, sequência e conquistas tornam o progresso visível.

## 2. Escopo atual do MVP

A primeira trilha é **Apresentações e informações pessoais**. Ela deverá conter aproximadamente dez a quinze nós, com vocabulário, estruturas, atividades intermediárias e uma missão contextual final.

O usuário do MVP deverá conseguir entrar, informar palavras que já conhece, abrir uma trilha, visualizar o mapa, estudar palavras em contexto, consultar o dicionário, concluir uma atividade intermediária, revisar com flashcards, realizar uma missão e ver o progresso atualizado.

Não fazem parte do MVP: rede social, ranking, loja, moedas, múltiplas trilhas completas, leitor avançado, conversação aberta, reconhecimento de voz e IA para gerar cursos.

## 3. Estado técnico atual

| Item | Estado |
|---|---|
| Plataforma | Expo mobile app |
| Expo | SDK 57.0.9 solicitado e fixado no `package.json` |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0.3 |
| Navegação | Expo Router 57 |
| Estilos | NativeWind 4 e tokens de tema |
| Animações | React Native Reanimated 4 |
| API preparada | tRPC + Zod |
| Banco preparado | Drizzle + MySQL/TiDB do scaffold |
| Auth preparada | Manus OAuth; Google OAuth planejado para produção |
| Dados locais | AsyncStorage e futura fila de eventos |
| Testes | Vitest; teste atual de logout está ignorado por depender de sessão externa |

O CLI do Expo recomenda o patch mais recente `57.0.19`, mas o projeto permanece em `57.0.9` conforme decisão solicitada. Antes de alterar essa decisão, confirmar a necessidade e criar checkpoint.

## 4. Telas existentes

| Arquivo | Função | Estado |
|---|---|---|
| `app/(tabs)/index.tsx` | Tela Hoje | Personalizada com card de ação, progresso e métricas estáticas |
| `app/(tabs)/map.tsx` | Mapa | Estado inicial/preparado |
| `app/(tabs)/review.tsx` | Revisar | Estado inicial/preparado |
| `app/(tabs)/library.tsx` | Biblioteca | Estado inicial/preparado |
| `app/node/[id].tsx` | Detalhe do nó | Rota inicial funcional |
| `app/lesson/[id].tsx` | Etapa intermediária | Rota inicial funcional |
| `app/oauth/callback.tsx` | Callback OAuth | Não modificar sem necessidade |

## 5. Componentes-base existentes

Os componentes reutilizáveis ficam principalmente em `components/ui/`:

| Componente | Uso |
|---|---|
| `app-card.tsx` | Cards de conteúdo e ação |
| `app-button.tsx` | Botões com estados de pressão, loading e disabled |
| `progress-bar.tsx` | Progresso de nó, trilha e atividade |
| `stat-pill.tsx` | Métricas e cabeçalhos de seção |
| `coming-soon.tsx` | Estados provisórios de áreas ainda não implementadas |
| `icon-symbol.tsx` | Mapeamento de ícones entre plataformas |
| `screen-container.tsx` | Safe area e fundo de tela; usar em novas telas |

No React Native, não usar `className` em `Pressable`. Usar `style` para estados de pressão. Para listas, preferir `FlatList`. Novos providers devem ser registrados em `app/_layout.tsx`.

## 6. Identidade visual

A direção visual preserva a base do Caderno de Mandarim e evolui para uma linguagem mobile moderna:

| Token | Valor | Uso |
|---|---|---|
| Ink | `#172A35` | Texto e superfícies fortes |
| Seal | `#C8654A` | Ações e destaque principal |
| Sage | `#557B61` | Domínio e conclusão |
| Paper | `#FFFCF4` | Fundo principal |
| Sand | `#F5EEE0` | Superfícies secundárias |
| Gold | `#D7A84B` | XP e recompensas |

A tipografia de referência usa DM Serif Display para títulos, Noto Serif SC para hanzi, uma sans-serif para interface e JetBrains Mono para pinyin e dados técnicos.

O símbolo da marca e as cópias de branding estão em `assets/images/`. Artes próprias devem ser reservadas para identidade, onboarding, mapa especial, badges e ilustrações. Botões, barras, cards e ícones comuns devem ser implementados em código.

## 7. Prioridades atuais da tela Hoje

### P0 — executar primeiro

1. Conectar o card principal ao próximo nó real da trilha.
2. Substituir métricas estáticas por dados reais do usuário.
3. Mostrar revisões pendentes reais.
4. Adicionar estados de carregamento, vazio e erro.
5. Garantir o fluxo do botão principal até uma atividade funcional.
6. Validar novamente a experiência em viewport mobile portrait.

### P1 — executar depois do P0

Adicionar resumo visual da trilha, revisão recomendada por dificuldade, feedback de conclusão, sequência real, ação rápida para missão e microinterações discretas.

### P2 — deixar para depois

Personalização da saudação, ilustrações adicionais, animações de entrada, atalhos para outras trilhas e adaptação desktop.

## 8. Próxima sequência recomendada

A próxima implementação deve seguir esta ordem:

```text
1. Criar tipos compartilhados de learningPath, learningNode e userProgress
2. Definir dados estáticos versionados da trilha inicial
3. Criar endpoint ou repository para retornar o nó recomendado
4. Conectar `today.get` ou uma fonte equivalente à tela Hoje
5. Implementar o mapa vertical com os mesmos nós
6. Criar estados reais de palavra e progresso
7. Só então iniciar flashcards e SRS
```

Não começar pelo sistema de XP nem por novas ilustrações antes de existir um fluxo real de aprendizagem.

## 9. Arquitetura de domínio

As entidades principais são `lexicalEntries`, `userWordStates`, `learningPaths`, `learningNodes`, `nodeLexicalEntries`, `nodePrerequisites`, `lessonActivities`, `missions`, `userNodeProgress`, `reviewCards`, `reviewEvents`, `achievements`, `userAchievements` e `userProgress`.

A regra de separação é essencial: entrada lexical não é conhecimento do usuário; conhecimento não é cartão; cartão não é competência; e competência não é missão.

As regras de domínio devem ser determinísticas e testáveis. Cálculo de domínio, próxima revisão, XP e desbloqueios não devem ficar espalhados pelas telas.

## 10. Autenticação e dados

O desenvolvimento usa Manus OAuth por integração com o scaffold. A arquitetura deve manter um adaptador de autenticação para permitir Google OAuth em staging ou produção. O backend deve usar um `userId` interno, e não e-mail como chave principal.

A estratégia de dados é online-first com tolerância a interrupções. O mapa e o dicionário podem ter cache; preferências podem ser locais; respostas de revisão podem entrar em fila; XP, sequência e domínio devem ser confirmados no servidor. Eventos de revisão precisam de `clientEventId` idempotente.

## 11. Comandos de desenvolvimento e validação

```bash
pnpm install
pnpm dev
pnpm check
pnpm lint
pnpm test
```

O projeto usa Expo web no servidor gerenciado e pode ser testado via preview ou QR Code do ambiente. A validação mobile deve priorizar viewport portrait e, quando possível, dispositivo real.

## 12. Histórico recente

| Commit | Conteúdo |
|---|---|
| `fd407ad` | Tela Hoje, componentes-base, navegação inicial e branding |
| `76fd897` | Migração e correções para Expo SDK 57 |
| `e09fa70` | Documentação inicial da Etapa 1 |
| `4bf7e7f` | Checkpoint final da Etapa 1 antes da publicação |
| `2be2580` | Publicação do backlog final da Etapa 1 |

O repositório GitHub é `https://github.com/tiago-prog/mapa-de-mandarim`, privado, branch `main`. O remote local `github` aponta para esse repositório; `origin` continua sendo o remote interno do ambiente.

## 13. Protocolo obrigatório entre IAs

Antes de alterar código, revisar este arquivo, `README.md`, `docs/architecture.md` e `todo.md`. Para qualquer nova solicitação de funcionalidade ou bug, adicionar tarefas pendentes ao final de `todo.md` antes da implementação.

Ao concluir uma funcionalidade, marcar imediatamente as tarefas correspondentes como concluídas. Executar as validações apropriadas e registrar limitações ou avisos relevantes.

Antes de publicar, revisar o `todo.md` completo, salvar um checkpoint e verificar o estado Git. Depois, criar um commit descritivo e fazer push para `github main`.

Cada commit e push deve deixar documentados: objetivo, arquivos alterados, decisões, validações, limitações, hash, branch, remoto e próximo passo. Manter este arquivo atualizado quando houver uma mudança relevante de arquitetura, fluxo ou prioridade.

## 14. Cuidados importantes

Não usar `git reset --hard`. Para recuperar um estado, usar rollback por checkpoint. Não adicionar secrets diretamente em arquivos ou commits. Não copiar o schema inteiro do Caderno de Mandarim; extrair somente dados e lógica realmente necessários.

A tela Hoje ainda exibe dados de demonstração em alguns pontos. Antes de apresentar o fluxo como funcional, substituir esses valores por dados do domínio ou estados explícitos de carregamento/indisponibilidade.


## Rodada de sincronização e preview — 2026-09-03

- Foi feito pull/fetch do GitHub antes do trabalho.
- A `main` remota recebeu o commit `9f72273` da outra IA, contendo o primeiro vertical slice funcional.
- O `todo.md` apresentou conflito durante a integração; os blocos locais e remotos foram mesclados manualmente sem perda de tarefas.
- O vertical slice integrado inclui trilha inicial, cinco nós, atividades de múltipla escolha, procedures `today`, `learningMap`, `lesson` e `progression`, persistência com fallback em memória, idempotência por `clientEventId`, testes e export estático web.
- Foi criado o commit `ed0a1d4` na branch `chore/sync-handoff-preview` e enviado ao remote `github`, atualizando o Pull Request existente.
- O preview mobile foi gerado para `/`, `/map`, `/node/intro` e `/lesson/intro`.
- O preview revelou contraste insuficiente em textos sobre superfícies `ink`; a correção substituiu `text-surface` por `text-background` em `app/(tabs)/index.tsx` e `app/(tabs)/map.tsx`.
- Após a correção, TypeScript, lint, testes e build passaram. Os testes exibem fallback esperado porque a tabela `learning_paths` ainda não existe no banco do ambiente.
- Próxima pendência técnica: aplicar a migração no banco de desenvolvimento/staging e remover o fallback do preview quando o banco estiver disponível.

### Protocolo desta rodada

Sempre fazer pull/fetch e verificar `git status` antes de editar. Ler este handoff e o `todo.md`. Preservar alterações de outras IAs, resolver conflitos manualmente e documentar a integração. Antes de entregar, executar validações, gerar preview, atualizar o backlog, salvar checkpoint e registrar commit/PR.
