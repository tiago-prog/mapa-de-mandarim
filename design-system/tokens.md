# Design system — Mapa de Mandarim

`tokens.json` é a fonte canônica dos valores usados pela interface remodelada. Os aliases semânticos seguem a leitura editorial da referência: `paper` é o campo da página, `sand` contextualiza progresso e orientação, `ink` concentra uma ação ou modo focado, `seal` marca a marca e estados de atenção, `sage` comunica sucesso, `gold` representa ação/progresso e `sky` é reservado para foco e informação.

Toda interação deve manter **44 × 44 px** como área mínima de toque. Cards usam raio de 20 px e superfícies dominantes usam 28 px; pills usam 999 px. A escala de espaçamento é baseada em múltiplos de 4 px. Valores fora da escala precisam ser justificados como exceção visual.

O contrato responsivo é 320–389 px para mobile estreito, 390–767 px para mobile padrão, 768–1023 px para tablet e 1024 px ou mais para desktop. Em desktop o produto usa `LearnerShell` ou `FocusShell` com navegação superior; o Admin usa `AdminShell`. Em revisão ou lição ativa a navegação persistente deve ser ocultada, preservando somente a casca compacta com marca e perfil.

Os componentes devem comunicar estado com pelo menos dois canais — texto, forma, ícone, posição ou cor — e oferecer estados de loading, vazio, zero, parcial, stale, erro, mutação, desabilitado e foco. A paleta escura está preparada nos tokens, mas só deve ser considerada aprovada após contraste e previews equivalentes em todas as telas.
