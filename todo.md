# Project TODO

## Etapa 1 — Preparação do produto e do projeto

- [x] Inicializar novo projeto mobile first com Expo, React Native e TypeScript
- [x] Definir direção mobile portrait e uso com uma mão
- [x] Criar plano inicial de interface em design.md
- [x] Definir abas principais: Hoje, Mapa, Revisar e Biblioteca
- [x] Definir paleta inicial baseada no Caderno de Mandarim
- [x] Definir tipografia de referência para títulos, hanzi, interface e pinyin
- [x] Definir nome final e identidade definitiva do aplicativo
- [x] Definir primeira trilha pedagógica do MVP
- [x] Registrar decisões de arquitetura e modelo de domínio
- [x] Definir estratégia de autenticação: Manus OAuth no desenvolvimento e Google OAuth para produção
- [x] Definir política de dados locais e sincronização

## Etapa 2 — Identidade visual e design system

- [x] Criar símbolo principal da marca
- [ ] Criar logotipo horizontal
- [x] Criar ícone do aplicativo
- [x] Configurar tokens de tema no projeto
- [x] Criar componentes-base de botão, card e progresso
- [ ] Selecionar biblioteca de ícones
- [ ] Criar ativos proprietários P0

## Etapa 3 — Base mobile e autenticação

- [x] Substituir a tela inicial do template pela tela Hoje
- [x] Configurar navegação inferior mobile first
- [ ] Implementar tema claro e escuro
- [x] Implementar estados de carregamento e erro
- [ ] Integrar fluxo de autenticação inicial
- [ ] Criar tela de boas-vindas
- [ ] Criar tela de diagnóstico inicial

## Etapa 4 — Dicionário e palavras conhecidas

- [ ] Importar dataset lexical selecionado do Caderno de Mandarim
- [x] Criar entidade de entrada lexical
- [x] Criar busca por hanzi, pinyin e significado
- [x] Criar ficha detalhada da palavra
- [x] Criar estado pessoal da palavra
- [x] Criar lista Minhas palavras
- [ ] Adicionar áudio de pronúncia quando disponível

## Etapa 5 — Mapa e trilha inicial

- [x] Criar entidades de trilha e nó
- [x] Criar relações de pré-requisito
- [x] Criar estados visuais dos nós
- [x] Implementar mapa vertical mobile
- [x] Criar detalhe do nó
- [x] Criar progresso por nó
- [x] Configurar primeira trilha de aprendizagem

## Etapa 6 — Etapa intermediária e missões

- [ ] Criar atividades de associação
- [ ] Criar atividades de reconhecimento em frase
- [x] Criar atividade de ordenação de frase
- [x] Criar atividade de preenchimento de lacuna
- [ ] Criar entidade de missão
- [x] Criar missão final da primeira trilha
- [ ] Registrar conclusão da atividade e da missão

## Etapa 7 — Flashcards e SRS

- [x] Criar modelo de cartão associado à entrada lexical, separado do nó
- [x] Implementar política determinística de repetição espaçada
- [x] Criar sessão de revisão
- [x] Implementar revelação de resposta
- [x] Implementar avaliações esqueci, difícil e fácil no motor e na API
- [x] Registrar eventos de revisão com idempotência por `clientEventId`
- [x] Mostrar revisões pendentes na tela Hoje

## Etapa 8 — Gamificação e progresso

- [x] Criar XP
- [ ] Criar sequência diária
- [ ] Criar regras de domínio por nó
- [x] Implementar desbloqueio de nós
- [ ] Criar conquistas iniciais
- [ ] Mostrar resultado pós-atividade
- [x] Atualizar visualmente o mapa após progresso

## Etapa 9 — Validação do MVP

- [ ] Testar fluxo completo de primeiro acesso
- [x] Testar fluxo completo de aprendizagem de um nó
- [x] Testar fluxo de consulta no dicionário
- [x] Testar fluxo de revisão
- [ ] Testar persistência de progresso (bloqueado até existir banco de staging)
- [ ] Testar estados de erro e reconexão
- [ ] Validar uso em telas portrait pequenas
- [ ] Validar acessibilidade básica
- [x] Executar TypeScript, lint e testes
- [x] Criar checkpoint da primeira entrega funcional

## Pós-MVP

- [ ] Validar Google OAuth em staging (depende do ambiente de staging)
- [ ] Adicionar novas trilhas
- [ ] Adicionar leitor de textos
- [ ] Avaliar recursos de IA
- [ ] Avaliar experiência desktop
- [ ] Avaliar recursos sociais

## Personalização da tela Hoje e componentes-base

- [x] Definir composição mobile first da tela Hoje com uma ação principal
- [x] Criar componente reutilizável de card de ação recomendada
- [x] Criar componente reutilizável de indicador de progresso
- [x] Criar componente reutilizável de métrica diária
- [x] Criar componente reutilizável de seção e cabeçalho de tela
- [x] Configurar navegação inferior inicial para Hoje, Mapa, Revisar e Biblioteca
- [x] Substituir a tela inicial do template pela tela Hoje
- [x] Adicionar estados de carregamento, vazio e erro na tela Hoje
- [x] Validar a tela Hoje em viewport mobile portrait

## Migração para Expo SDK 57

- [x] Auditar compatibilidade do Expo SDK 57.0.9 com o scaffold atual
- [x] Atualizar Expo SDK e módulos Expo para versões compatíveis
- [x] Atualizar React Native, Expo Router e dependências relacionadas conforme compatibilidade
- [x] Regenerar lockfile e validar instalação
- [x] Corrigir incompatibilidades de TypeScript, lint e runtime
- [x] Validar tela Hoje, navegação e rotas principais após a migração
- [x] Executar testes e salvar checkpoint da migração

## Finalização da Etapa 1 e publicação

- [x] Definir nome e identidade de trabalho do produto para esta fase
- [x] Documentar a primeira trilha pedagógica e seus limites de MVP
- [x] Documentar arquitetura e modelo de domínio inicial
- [x] Documentar estratégia de autenticação Manus OAuth e futura transição para Google OAuth
- [x] Documentar política de dados locais, sincronização e escopo offline
- [x] Atualizar README com a visão e o estado atual do projeto
- [x] Validar TypeScript, lint, testes e preview
- [x] Salvar checkpoint final da Etapa 1
- [x] Criar commit final da Etapa 1
- [x] Fazer push para o repositório privado do GitHub

## Etapa 2 — Primeiro vertical slice funcional

- [x] Criar domínio puro da trilha inicial
- [x] Criar dados iniciais de cinco nós e cinco atividades
- [x] Criar schema mínimo de trilhas, nós, vocabulário, atividades e progresso
- [x] Gerar migração Drizzle `0001_spotty_hellfire_club.sql`
- [x] Criar seed idempotente da trilha inicial
- [x] Criar procedures `today`, `learningMap`, `lesson` e `progression`
- [x] Persistir progresso e XP com fallback em memória para preview sem banco
- [x] Substituir mocks da tela Hoje por dados do domínio
- [x] Implementar mapa vertical com estados visuais dos nós
- [x] Implementar detalhe do nó com progresso real
- [x] Implementar atividade de múltipla escolha com feedback
- [x] Adicionar idempotência por `clientEventId`
- [x] Adicionar testes de domínio e integração do fluxo
- [x] Validar TypeScript, lint, testes e build
- [x] Validar export estático web
- [ ] Aplicar a migração no banco do ambiente de desenvolvimento/staging (bloqueado: ainda não há `DATABASE_URL`)
- [ ] Substituir o fallback de preview por dados reais após configurar o banco (depende do provisionamento de staging)

## Etapa 3 — Dicionário e palavras conhecidas

- [x] Criar busca por hanzi, pinyin e significado
- [x] Criar ficha contextual com exemplo em mandarim e tradução
- [x] Criar estados nova, conhecida e em aprendizado
- [x] Criar filtro de palavras conhecidas e em aprendizado
- [x] Persistir estado pessoal quando o banco estiver disponível
- [x] Manter fallback local para preview sem banco
- [x] Adicionar testes de busca e atualização de estado
- [x] Gerar migração Drizzle `0002_lowly_epoch.sql`
- [ ] Importar o dataset lexical completo selecionado do Caderno de Mandarim
- [ ] Adicionar áudio de pronúncia

## Etapa 4 — Nós como unidades pedagógicas

- [x] Definir sete etapas por nó: objetivo, contexto, vocabulário, gramática, prática, aplicação e revisão
- [x] Criar objetivo comunicativo e critérios de sucesso por nó
- [x] Adicionar diálogos contextualizados com tradução revelável
- [x] Adicionar vocabulário e exemplos vinculados a cada nó
- [x] Adicionar explicações gramaticais curtas e orientadas ao uso
- [x] Criar prática de reconhecimento sem expor o gabarito antes da resposta
- [x] Criar prática de ordenação de frase
- [x] Criar aplicação contextual ao final da prática
- [x] Calcular progresso pela conclusão das atividades essenciais
- [x] Exibir plano de ensino e número de etapas no detalhe do nó
- [x] Proteger o gabarito nas queries e retorná-lo apenas após a tentativa
- [x] Validar o percurso em testes de domínio e integração
- [ ] Adicionar áudio real de pronúncia
- [x] Criar atividade de preenchimento de lacuna
- [x] Criar missão final com diálogo completo
- [ ] Conectar revisão e SRS ao fechamento do nó

## Etapa 4 — Integração entre lições e vocabulário pessoal

- [x] Criar política pura de exposição lexical
- [x] Promover palavras novas para `learning` ao praticar uma atividade
- [x] Preservar palavras marcadas manualmente como `known`
- [x] Atualizar `lastSeenAt` em cada exposição relevante
- [x] Persistir a exposição no banco dentro da transação da atividade
- [x] Compartilhar o estado lexical no fallback em memória do preview
- [x] Cobrir a política com testes unitários e de integração
- [x] Criar modelo de cartões SRS e histórico de revisões
- [x] Criar a aba Revisar funcional

## Próximo checkpoint

O ambiente oficial de desenvolvimento agora é MariaDB local, reproduzível pelos instaladores Ubuntu e Windows PowerShell. O próximo incremento do produto pode continuar sem banco compartilhado. Um banco remoto separado só será necessário na publicação ou se houver colaboração entre máquinas. A URL real nunca deve ser gravada no repositório nem incluída em commits.

## Handoff para a próxima IA

### Bloqueio atual

Não há banco remoto compartilhado de desenvolvimento/staging, mas isso não bloqueia o trabalho individual. O ambiente local usa MariaDB e é reproduzível pelos scripts documentados. A persistência remota e os testes de publicação continuam pendentes até existir um servidor externo. Não criar uma URL fictícia, não gravar credenciais no repositório e não alterar a arquitetura MySQL/TiDB sem uma decisão explícita.

### Estado funcional já entregue

- [x] Fluxo de aprendizagem com progresso, XP, exposição lexical e fallback em memória.
- [x] Cartões SRS, histórico, motor determinístico, avaliações e idempotência.
- [x] Sessão visual da aba Revisar com revelação, áudio, avaliações e resumo.
- [x] Contagem de revisões vencidas e botão “Revisar agora” na tela Hoje.
- [x] Ativação automática de cartões quando palavras entram em `learning`.
- [x] Testes, TypeScript, lint, build e preview local validados.

### Retomada recomendada quando houver banco

1. Provisionar um banco remoto somente quando publicação ou colaboração exigirem.
2. Disponibilizar `DATABASE_URL` somente no ambiente de execução.
3. Executar o instalador correspondente ou aplicar as migrações SQL em ordem; revisar o journal antes de usar `pnpm db:push`.
4. Iniciar a API com `DATABASE_URL` configurada.
5. Confirmar as tabelas `srs_cards` e `srs_reviews` e a criação de registros após uma atividade.
6. Validar persistência do cartão, avaliação, próximo vencimento e histórico após reiniciar a API.
7. Só então marcar como concluídos os itens de migração, persistência e OAuth no ambiente remoto.

### Trabalho que pode continuar sem banco

A próxima IA pode avançar em acessibilidade, estados de reconexão, onboarding, tema claro/escuro, importação do dataset lexical, áudio real, sequência diária, domínio por nó, conquistas e área administrativa. O modo de fallback em memória deve continuar sendo usado nos testes locais.

## Ambiente local de desenvolvimento

- [x] Provisionar MariaDB local temporário no sandbox para desenvolvimento.
- [x] Aplicar as migrações `0000` a `0007` no banco local.
- [x] Corrigir o índice de atividades para suportar múltiplas etapas por nó.
- [x] Validar seed do MVP com uma trilha, cinco nós, onze entradas lexicais e onze atividades.
- [x] Validar persistência de atividade, vocabulário, progresso, cartão SRS e avaliação.
- [x] Criar instalador Bash para Ubuntu.
- [x] Criar instalador PowerShell nativo para Windows.
- [x] Criar `.env.example` seguro e proteger arquivos locais no `.gitignore`.
- [x] Documentar execução, migrações e limites do ambiente local.
- [ ] Provisionar banco remoto apenas quando publicação ou colaboração exigirem.
