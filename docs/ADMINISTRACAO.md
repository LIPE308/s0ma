# Administração SOMA

## Direção e escopo

Operação solidária em azul: azul royal #1748F5 para decisões e navegação, azul claro #EAF0FF para agrupamentos, branco #FFFFFF para leitura, tinta #142238 e cinza #617086. Os componentes continuam usando os tokens existentes e suas versões escuras. Manrope apresenta dados e controles, Sora identifica seções.

Em desktop, uma navegação lateral compacta organiza a fila de trabalho; no celular, os mesmos destinos aparecem em controles que quebram em linhas. O centro do painel é o trabalho pendente: campanhas e urgências aguardando revisão. A visão de anúncios mostra o caminho receita → fundo → créditos por campanha, com datas e origem. Tabelas/listas oferecem busca, filtros e paginação. Informações de demonstração permanecem identificadas.

Revisão do plano: manter apenas cartões de totais produziria um painel genérico e esconderia o trabalho. A prioridade será a fila de análise e a reconciliação, com acesso direto a evidências e decisões. Não serão usados gráficos ou receitas inventadas para preencher espaços.

## Integrações

O aplicativo usa o servidor MySQL; o Workbench é um cliente do mesmo banco. Credenciais de OAuth, SMTP e anúncios ficam somente em arquivos locais ignorados pelo Git. O login Google usa OpenID Connect; o envio de e-mail tem configuração independente. AdSense/AdMob exigem uma conta aprovada e autorização do proprietário. Relatórios estimados não são saldo disponível e não são distribuídos automaticamente.

## Uso e configuração

A rota /administracao exige sessão de administrador; a API também valida o papel em todas as operações. Para provisionar um operador local use npm run admin:local -- seu-email. A senha gerada fica em backend/.admin-local.json, ignorado pelo Git. Não compartilhe esse arquivo.

Copie as opções necessárias de backend/.env.exemplo para backend/.env. Google exige cliente OAuth Web com a origem e o callback exatos. SMTP é configurado separadamente com senha de app quando aplicável. O painel mostra a disponibilidade e permite verificar SMTP sem enviar mensagem. Falhas de e-mail são registradas e podem ser reenviadas. O estado enviado significa aceitação pelo servidor SMTP; não comprova leitura. Avisos do app não são push do sistema operacional.

As decisões de urgência gravam o histórico, o aviso e a fila de e-mail na mesma transação. O worker retoma pendências com limite de tentativas. Teste de ponta a ponta realizado em banco separado, com campanha fictícia e envio SMTP, preservando campanhas reais.

Workbench usa a mesma conexão MySQL, com instruções somente de consulta em WORKBENCH-SOMA.sql. Credenciais reais não fazem parte do repositório. Relatórios AdSense/AdMob exigem conta aprovada e credenciais próprias; sem isso, não há receita real importada. O APK de teste usa login por e-mail e senha: o cliente Google atual é para a web.
