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
- [ ] Criar entidade de entrada lexical
- [ ] Criar busca por hanzi, pinyin e significado
- [ ] Criar ficha detalhada da palavra
- [ ] Criar estado pessoal da palavra
- [ ] Criar lista Minhas palavras
- [ ] Adicionar áudio de pronúncia quando disponível

## Etapa 5 — Mapa e trilha inicial

- [ ] Criar entidades de trilha e nó
- [ ] Criar relações de pré-requisito
- [ ] Criar estados visuais dos nós
- [ ] Implementar mapa vertical mobile
- [ ] Criar detalhe do nó
- [ ] Criar progresso por nó
- [ ] Configurar primeira trilha de aprendizagem

## Etapa 6 — Etapa intermediária e missões

- [ ] Criar atividades de associação
- [ ] Criar atividades de reconhecimento em frase
- [ ] Criar atividade de ordenação de frase
- [ ] Criar atividade de preenchimento de lacuna
- [ ] Criar entidade de missão
- [ ] Criar missão final da primeira trilha
- [ ] Registrar conclusão da atividade e da missão

## Etapa 7 — Flashcards e SRS

- [ ] Criar modelo de cartão associado a palavra e nó
- [ ] Importar e adaptar lógica de repetição espaçada
- [ ] Criar sessão de revisão
- [ ] Implementar revelação de resposta
- [ ] Implementar avaliações esqueci, difícil e fácil
- [ ] Registrar eventos de revisão
- [ ] Mostrar revisões pendentes na tela Hoje

## Etapa 8 — Gamificação e progresso

- [ ] Criar XP
- [ ] Criar sequência diária
- [ ] Criar regras de domínio por nó
- [ ] Implementar desbloqueio de nós
- [ ] Criar conquistas iniciais
- [ ] Mostrar resultado pós-atividade
- [ ] Atualizar visualmente o mapa após progresso

## Etapa 9 — Validação do MVP

- [ ] Testar fluxo completo de primeiro acesso
- [ ] Testar fluxo completo de aprendizagem de um nó
- [ ] Testar fluxo de consulta no dicionário
- [ ] Testar fluxo de revisão
- [ ] Testar persistência de progresso
- [ ] Testar estados de erro e reconexão
- [ ] Validar uso em telas portrait pequenas
- [ ] Validar acessibilidade básica
- [ ] Executar TypeScript, lint e testes
- [ ] Criar checkpoint da primeira entrega funcional

## Pós-MVP

- [ ] Validar Google OAuth em staging
- [ ] Adicionar novas trilhas
- [ ] Adicionar leitor de textos
- [ ] Avaliar recursos de IA
- [ ] Avaliar experiência desktop
- [ ] Avaliar recursos sociais

## Tela Hoje e componentes-base — prioridades ajustadas

### P0 — Essencial para a primeira experiência funcional

- [x] Definir composição mobile first da tela Hoje com uma ação principal
- [x] Criar componente reutilizável de card de ação recomendada
- [x] Criar componente reutilizável de indicador de progresso
- [x] Criar componente reutilizável de métrica diária
- [x] Criar componente reutilizável de seção e cabeçalho de tela
- [x] Configurar navegação inferior inicial para Hoje, Mapa, Revisar e Biblioteca
- [x] Substituir a tela inicial do template pela tela Hoje
- [ ] Conectar o card principal da tela Hoje ao próximo nó real da trilha
- [ ] Substituir métricas estáticas por dados de progresso do usuário
- [ ] Mostrar revisões pendentes reais na tela Hoje
- [ ] Adicionar estados de carregamento, vazio e erro na tela Hoje
- [ ] Garantir que o botão principal tenha fluxo funcional até uma atividade
- [ ] Validar a tela Hoje em viewport mobile portrait

### P1 — Melhoria de clareza e retenção

- [ ] Adicionar resumo visual do progresso da trilha atual
- [ ] Adicionar seção de revisão recomendada com prioridade por dificuldade
- [ ] Adicionar feedback de conclusão após uma atividade
- [ ] Adicionar estado de sequência diária sem depender de números fictícios
- [ ] Adicionar ação rápida para abrir a próxima missão
- [ ] Adicionar microinterações discretas em progresso, conclusão e pressões
- [ ] Validar contraste, áreas de toque e leitura dos componentes-base

### P2 — Polimento posterior

- [ ] Adicionar personalização da saudação por horário e nome do usuário
- [ ] Adicionar ilustração proprietária de estado vazio
- [ ] Adicionar animação de entrada apenas onde comunicar progresso
- [ ] Adicionar atalhos para explorar outras trilhas
- [ ] Adaptar a composição da tela Hoje para desktop

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

## Documentação de transição entre IAs

- [x] Criar arquivo de transição atualizado com estado, decisões, validações e próximos passos
- [x] Registrar no arquivo de transição o protocolo para commits e pushes

## Sincronização, preview e Pull Request

- [x] Fazer pull e verificar alterações locais e remotas
- [x] Gerar preview atualizado do projeto
- [x] Criar ou atualizar Pull Request no GitHub quando houver alterações publicáveis
- [x] Documentar o resultado da sincronização e do preview
