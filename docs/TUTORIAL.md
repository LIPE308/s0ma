# Tutorial e destaque do apoio publicitário

Rota pública /tutorial, com cinco etapas ilustradas: causas e urgências, formas de ajudar, criação e revisão de campanha, modelo de receita publicitária e acompanhamento de impacto. Ilustrações são componentes React Native locais, adaptados aos temas claro/escuro e identificados como prévias ilustradas. Não exigem downloads de imagens nem conexão para o conteúdo educativo.

Acesso pelo botão Conheça o SOMA no login e pelo primeiro item do menu do perfil. Permite avançar, voltar, saltar diretamente para uma etapa e fechar. O fechamento volta à tela de origem; entrada direta sem histórico volta ao app ou login conforme a sessão. O formulário de login é preservado ao visitar o tutorial. Movimento utiliza EntryMotion existente e respeita movimento reduzido.

O diferencial dos anúncios aparece em um cartão após os atalhos do início e nos detalhes de campanhas urgentes elegíveis. O cartão abre /tutorial?etapa=anuncios. Explica a destinação de 70% da receita líquida confirmada ao fundo e a elegibilidade das urgências revisadas. A versão atual tem publicidade simulada, informada na etapa explicativa; compartilhar não garante receita por acesso. Não houve integração com provedor, criação de crédito ou mudança no financeiro.

Verificação: tipos, lint e exportações web raiz e /soma. Navegador em 390 px percorreu as cinco etapas, retornou ao login preservando o e-mail, abriu o atalho de anúncios na quarta etapa e conferiu o tema escuro sem transbordamento. Nenhuma chamada de cadastro, doação ou pagamento foi feita nesses testes.
