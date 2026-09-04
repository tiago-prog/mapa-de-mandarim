# QA visual — 2026-09-04

As capturas com JavaScript habilitado foram redirecionadas ao login porque o cliente Expo Router reancora a rota ao recarregar sem sessão; o HTML pré-renderizado da rota `/dev/remodel-preview` contém corretamente o conteúdo remodelado, confirmado por `curl` e pelo export estático.

A captura `preview-static-check.png` foi feita com JavaScript desabilitado para validar a composição pré-renderizada sem autenticação. Os breakpoints finais são `mobile-320.png`, `mobile-390.png`, `tablet-768.png`, `desktop-1024.png` e `desktop-1440.png`. A captura anterior com JavaScript habilitado mostrando login não deve ser usada como evidência de UI das telas autenticadas.

Após o ajuste de breakpoint, o bundle e o HTML exportado continuaram contendo a rota remodelada, mas Chromium manteve o estado/login ao capturar a URL sem uma sessão. A próxima captura usa `--incognito` e query string para eliminar cache. A validação estrutural segue passando; as capturas autenticadas da UI precisam ser interpretadas junto do HTML exportado, pois o guard `(tabs)` exige sessão real.

A inspeção pós-ajuste ainda mostrou o login em capturas HTTP navegadas, embora o HTML gerado contenha o preview; isso é efeito do guard/hidratação do Expo Router sem sessão. Uma cópia file:// sem scripts foi gerada para isolamento, mas pode não carregar CSS absoluto e serve apenas como diagnóstico, não como evidência visual final.

A captura standalone `home-390.png` confirma a tela Hoje remodelada sem a barra de QA. A captura `map-390.png` mostrou a tela Hoje com a barra de navegação do harness porque `useLocalSearchParams` não expõe a query `screen` no HTML pré-renderizado servido por `serve`; o harness será ajustado para ler a query no cliente e então recapturado com breve espera.

As capturas standalone mobile `map-390.png` e `review-390.png` agora renderizam os estados corretos. Mapa mostra trilha em sand, progresso, timeline e estados concluído/em progresso/disponível. Revisar mostra o cartão em modo foco, tipografia hanzi ampla, ação única `Revelar resposta` e ausência de tab bar.

As primeiras capturas standalone de Biblioteca/Nó mantiveram a Home por insuficiência do tempo de hidratação do Chromium. Elas foram recapturadas com 10 s de orçamento após o harness ler a query diretamente do `window.location`; as imagens finais serão inspecionadas agora.

As rotas standalone explícitas de QA foram geradas, mas ainda caíram no login porque somente `dev/remodel-preview` estava declarado no stack raiz; os wrappers também precisam ser registrados como telas públicas de preview. Nenhum fluxo de produção será alterado além do harness de desenvolvimento.

As capturas standalone finais `library-390.png` e `node-390.png` renderizam corretamente sem login. Biblioteca mostra busca, filtros com toque mínimo, estado pessoal e item lexical. Nó mostra objetivo comunicativo, progresso e plano sequencial com estados Agora/A seguir/Disponível.

As capturas finais `result-390.png` e `review-1440.png` confirmam o resultado de sessão com métricas e CTA acessível, além do modo de revisão desktop com top navigation, card dominante e reveal-first.

As capturas finais `mobile-320.png` e `desktop-1440.png` confirmam a responsividade da tela Hoje: no mobile o card dominante e os indicadores empilham sem clipping; no desktop a top nav e a composição em duas colunas aparecem corretamente.
