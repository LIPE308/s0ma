# Transições de navegação

O layout raiz cobre todas as rotas, incluindo páginas fora das abas e telas de autenticação. Na web, `NavigationMotion` anima opacidade de 0,35 até 1 e deslocamento vertical de 12 px até zero em 300 ms, com desaceleração cúbica. O efeito reinicia ao mudar caminho ou parâmetros da rota, inclusive ao voltar. Não se usa `key` para remontar o navegador: estado de formulários e histórico permanecem sob controle do Expo Router.

No Android e iOS, o Stack usa `fade_from_bottom`, com duração configurada de 300 ms (a duração efetiva depende da plataforma). As abas usam fade de 240 ms no aparelho. Na web o fade das abas é desativado para não se sobrepor à animação global. A animação anterior limitada ao corpo de `Screen` foi removida dessa composição, evitando efeitos simultâneos no mesmo conteúdo.

Todas as transições consultam `useReducedMotion`, que acompanha a preferência do sistema e alterações durante o uso. Trocas rápidas cancelam a animação anterior; a limpeza restaura o valor final. Não há bloqueio de cliques, esperas artificiais, alteração de requisições, autenticação ou pagamentos.

Verificação: tipos, lint e exportação web; navegação Mapa → Municípios e retorno no navegador; amostragem de quadros confirmou opacidade inicial 0,35, final 1 e deslocamento final zero. Com movimento reduzido a tela permanece em opacidade 1, sem deslocamento. Conferir a aparência das transições nativas em aparelho físico na próxima build de teste.

Referência: https://reactnavigation.org/docs/native-stack-navigator/
