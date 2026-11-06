# Prioridade de campanhas e confirmação de saída

Campanhas ativas com urgência crítica revisada aparecem primeiro. As quatro situações emergentes iniciais do projeto mantêm sua prioridade visual, sem receber alegação de revisão administrativa por causa do identificador. A seguir vêm as moderadas revisadas e as regulares; encerradas ficam ao final. A API deixa de intercalar campanhas comuns entre críticas. Filtros de busca permanecem; ordenações secundárias são preservadas dentro de cada grupo de prioridade.

O componente `SeloUrgencia` aplica um selo vermelho `URGENTE` aos cartões completos, compactos e detalhes das campanhas ativas elegíveis. A tela inicial mantém a composição e o limite de dois destaques. Declaração de urgência não revisada não concede prioridade real nem altera receita, distribuição ou permissões.

Sair da conta abre um diálogo de confirmação com `Sim, sair da conta` e `Continuar na conta`. Cancelar ou fechar o diálogo não chama a API. Confirmar bloqueia os botões durante o pedido e só limpa a sessão após resposta de sucesso; erros mantêm a conta aberta e exibem mensagem no diálogo. Não remove campanhas nem histórico.

Validação em 06/11/2026: 52 testes MySQL e dois testes de prioridade passaram, além de tipos, lint e exportações web raiz e `/soma`. Na URL pública, cartões urgentes foram os quatro primeiros tanto no feed como na busca por recentes, e o selo exibiu fundo vermelho. O fluxo de saída foi conferido no navegador com sessão e API interceptadas somente durante o teste: cancelar enviou zero pedidos, confirmar enviou um e abriu a entrada. As interceptações foram removidas em seguida. Nenhuma conta real foi criada ou encerrada nesses testes.
