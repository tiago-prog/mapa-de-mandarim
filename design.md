# Design Plan — Mapa de Mandarim

## Direção do produto

O Mapa de Mandarim é um aplicativo mobile first de aprendizagem de mandarim. A experiência principal deve funcionar em orientação portrait 9:16, com uso confortável por uma mão, decisões simples e uma próxima ação sempre evidente.

A interface combina a identidade editorial do Caderno de Mandarim com uma linguagem de produto moderna: azul-marinho profundo, terracota, verde sálvia, creme, bege suave e dourado reservado para recompensas. O mapa mental deve parecer explorável, mas funcionar como uma jornada guiada de competências.

## Princípios de interface

- Uma ação primária claramente visível por tela.
- Navegação inferior com quatro áreas: Hoje, Mapa, Revisar e Biblioteca.
- Conteúdo importante acima da zona inferior de alcance do polegar.
- Botões primários com área de toque confortável, estados de pressão e feedback imediato.
- Texto dinâmico, hanzi, pinyin, traduções e progresso renderizados pelo aplicativo, nunca incorporados em imagens de interface.
- O mapa é vertical e ramificado no mobile; não será um canvas infinito difícil de manipular.
- Gamificação deve orientar e celebrar, não punir.
- O layout deve funcionar sem depender apenas de cor para indicar estado.

## Sistema visual

| Token | Cor | Uso |
|---|---|---|
| `ink` | `#172A35` | Texto principal, títulos e estrutura |
| `seal` | `#C8654A` | Ação primária e destaque ativo |
| `sage` | `#557B61` | Domínio, sucesso e conclusão |
| `paper` | `#FFFCF4` | Fundo principal e superfícies claras |
| `sand` | `#F5EEE0` | Cards secundários e áreas de apoio |
| `muted` | `#6E756F` | Texto auxiliar |
| `gold` | `#D7A84B` | XP, conquistas e recompensas |
| `sky` | `#7A9BB5` | Informação e áudio |
| `error` | `#B85C52` | Erro e revisão necessária |

Tipografia de referência: DM Serif Display para títulos editoriais; Noto Serif SC ou Noto Sans SC para hanzi; Inter ou DM Sans para a interface; JetBrains Mono para pinyin, tons e métricas.

## Lista de telas

| Tela | Conteúdo principal | Ação primária |
|---|---|---|
| Boas-vindas | Proposta do mapa, ilustração simples e explicação curta | Começar |
| Autenticação | Login OAuth e estado de sessão | Entrar |
| Diagnóstico inicial | Palavras iniciais para classificar como conhecidas ou novas | Continuar |
| Escolha de trilha | Primeira trilha disponível e objetivo comunicativo | Começar trilha |
| Hoje | Próxima atividade, progresso do nó, revisões, XP e sequência | Continuar |
| Mapa | Trilha vertical, nós, conexões e estados de domínio | Abrir nó recomendado |
| Detalhe do nó | Objetivo, palavras, estrutura, progresso e pré-requisitos | Começar etapa |
| Etapa intermediária | Associação, compreensão, frase e áudio | Responder atividade |
| Flashcard | Hanzi/pinyin/áudio, revelação e avaliação | Revelar resposta |
| Missão | Situação contextual e resposta estruturada | Enviar resposta |
| Resultado | XP, progresso, palavras consolidadas e próximo passo | Ver mapa ou continuar |
| Biblioteca | Minhas palavras e busca do dicionário | Buscar palavra |
| Ficha da palavra | Hanzi, tradicional, pinyin, sentidos, áudio, exemplos e nós associados | Marcar estado |
| Configurações | Preferências de exibição, áudio e conta | Salvar alteração |

## Layout mobile portrait

### Tela Hoje

A tela deve usar um `ScrollView` curto, com cabeçalho compacto e conteúdo em cards empilhados:

1. Saudação e resumo da sequência.
2. Card grande da ação recomendada.
3. Indicadores de revisão e XP do dia.
4. Miniatura vertical do progresso atual no mapa.
5. Link secundário para explorar a Biblioteca.

O card da ação recomendada ocupa a maior área visual e contém título, objetivo, progresso e um único botão principal.

### Tela Mapa

O mapa usa um `ScrollView` vertical com nós centrados e ramificações curtas. O nó recomendado possui contorno terracota e um marcador sutil de próxima ação. O usuário pode tocar em nós visíveis para abrir detalhes. Nós bloqueados mostram o pré-requisito de forma legível.

Estados visuais dos nós:

- Bloqueado: baixa ênfase, ícone de cadeado e texto de requisito.
- Disponível: preenchimento creme, contorno terracota e ação ativa.
- Em progresso: barra parcial e destaque discreto.
- Concluído: verde sálvia e marca de conclusão.
- Dominado: verde sálvia mais forte, brilho sutil e badge de domínio.
- Precisa revisar: marcador de atenção terracota ou vermelho suave, sem apagar a conquista.

### Tela de detalhe do nó

Cabeçalho com botão de voltar, título e objetivo comunicativo. Em seguida, um card de domínio, lista compacta de palavras e estrutura, bloco de pré-requisitos e botão fixo ou destacado de início.

### Tela de etapa intermediária

Uma atividade por vez, com bastante espaço vertical. O hanzi deve possuir destaque visual, pinyin pode ser exibido como apoio configurável, áudio fica próximo da palavra e as respostas são grandes o suficiente para toque. Feedback de acerto ou erro aparece imediatamente sem bloquear o fluxo.

### Tela de flashcard

O card ocupa o centro da tela. A frente apresenta hanzi, áudio e contexto mínimo. O botão “Revelar resposta” aparece na zona inferior. Depois da revelação, as opções “Esqueci”, “Difícil” e “Fácil” aparecem como três ações grandes, com cores e ícones diferentes.

### Tela de Biblioteca

Usar controle segmentado ou abas internas entre “Minhas palavras” e “Dicionário”. A busca fica no topo. Listas longas devem usar `FlatList`, com cada item mostrando hanzi, pinyin, significado resumido e estado pessoal.

## Fluxos principais

### Primeiro acesso

Boas-vindas → Autenticação → Diagnóstico inicial → Escolha de trilha → Hoje.

### Aprender um nó

Hoje → Detalhe do nó → Etapa intermediária → Flashcards → Missão → Resultado → Mapa atualizado.

### Consultar uma palavra

Qualquer frase ou card → tocar na palavra → ficha rápida contextual → abrir dicionário completo ou marcar estado → retornar ao fluxo anterior.

### Retornar ao aplicativo

Hoje → prioridade recomendada: revisões críticas, continuação do nó atual ou missão disponível.

### Usuário que já conhece conteúdo

Diagnóstico → marcar palavras conhecidas → confirmação contextual curta → pular introdução redundante → prática e aplicação.

## Mapa inicial do MVP

Trilha: **Apresentações e informações pessoais**.

```text
Pronomes básicos
       │
Pessoas e identidade
   ┌───┴────┐
Dizer nome  Perguntar nome
   │          │
Países e nacionalidades
       │
Falar sobre outra pessoa
       │
Conectar palavras em frases
       │
Diálogo de apresentação
       │
Missão final da trilha
```

Cada nó contém objetivo, palavras associadas, uma etapa intermediária, cartões de revisão e critérios de domínio. O mapa mostra apenas a região atual e os próximos caminhos, evitando sobrecarga visual.

## Gamificação

A gamificação acompanha o fluxo e não exige uma tela independente no MVP.

- XP após atividades significativas.
- Sequência diária mostrada na tela Hoje.
- Nó visualmente fortalecido após domínio.
- Nova conexão revelada após desbloqueio.
- Badge após marcos reais.
- Missões com objetivo comunicativo claro.

Não usar ranking, vidas, energia, loja ou punição por perder sequência na primeira versão.

## Acessibilidade e feedback

Toda ação primária precisa ter feedback visual e, quando apropriado, háptico. Estados devem combinar cor, forma, ícone e texto. O aplicativo deve suportar texto ampliado razoavelmente, contraste suficiente e leitura clara de hanzi e pinyin.

O desenvolvimento deve seguir a ordem: funcionalidade, feedback e só depois animações. Animações devem ser sutis, entre 80 e 300 ms, sem efeitos excessivamente elásticos.

## Referências técnicas do scaffold

O projeto usa Expo SDK 54, React Native, Expo Router, NativeWind e Reanimated. As telas devem utilizar `ScreenContainer` para áreas seguras, `FlatList` para listas e `Pressable` com estilo de interação em vez de depender de `className` para pressionamento.
