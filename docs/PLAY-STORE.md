# Play Store: preparação e bloqueios

Verificado em 30/10/2026. Prioridade atual: Android; pagamentos reais e publicação iOS ficam para uma etapa posterior.

## Conta

A sessão Google do titular abriu o Play Console na tela de criação de conta de desenvolvedor. Não existe console de apps disponível nessa sessão. Nenhuma conta foi criada, contrato aceito, taxa paga ou app enviado ao Google.

O titular pode abrir https://play.google.com/console/ em casa e concluir o cadastro na mesma conta Google. Não precisa operar o computador da escola. O Google exige idade mínima de 18 anos, taxa única de US$ 25 e verificação de identidade. Novas contas pessoais também precisam verificar acesso a um Android físico. Não enviar documentos ou cartão pelo chat.

Para uma conta pessoal nova, produção depende de teste fechado com pelo menos 12 testadores inscritos por 14 dias consecutivos e posterior aprovação do acesso à produção. Um teste interno não substitui esse teste fechado. Cadastro e pagamento não garantem publicação pública no mesmo dia.

## Arquivo Android

Build AAB solicitado no EAS, com distribuição STORE e o mesmo keystore Android:

- Build: `22e4756a-00cd-4a67-8dbd-8fab35351d2f`
- [Acompanhar compilação](https://expo.dev/accounts/studio308/projects/soma-pulso/builds/22e4756a-00cd-4a67-8dbd-8fab35351d2f)
- Fonte: `c206e55`, perfil `production`
- Pacote: `com.soma.pulso`, versão `1.0.1`, versionCode `2`
- API: `https://soma-api-studio308.onrender.com/api`

Um AAB é um arquivo de envio ao Play Console; não é instalável como o APK compartilhado por MediaFire. Compilar não publica. A primeira versão usa o código atual e mantém pagamentos, repasses e fundo publicitário simulados. O Pix real não foi implementado. Uma atualização posterior precisa aumentar o versionCode.

## Rascunho de ficha para a versão de testes

Nome: SOMA

Descrição curta: Encontre campanhas, participe de ações e conecte pessoas para ajudar.

Descrição completa:

O SOMA conecta pessoas em torno de campanhas solidárias. Conheça histórias, encontre necessidades e participe com objetos, tempo ou ações de voluntariado.

Crie seu perfil, acompanhe campanhas e participações, receba avisos e compartilhe causas com outras pessoas. Campanhas passam por revisão e o aplicativo oferece um canal de denúncias.

Nesta versão de testes, as contribuições financeiras, os repasses e o fundo publicitário são demonstrações. Nenhum pagamento, Pix ou transferência real é realizado.

## Pendências antes de enviar para análise

- Concluir e verificar a conta de desenvolvedor correta, sem preencher dados fictícios.
- Definir responsável e canal público de atendimento; revisar e publicar política de privacidade completa. A rota `/privacidade` atual é um resumo acadêmico e informa ausência de canal público.
- Implementar solicitação de exclusão de conta/dados no app e uma página pública correspondente. Sair da sessão não exclui a conta.
- Preparar acesso de revisão, classificação de conteúdo, público-alvo, categoria e declarações de segurança de dados compatíveis com o código. Não declarar integração de anúncios ou pagamentos reais inexistentes.
- Conferir moderação de conteúdo de usuários e funcionamento em Android físico.
- Preparar capturas reais de celular e gráfico de destaque; revisar ícone e textos finais. Não usar imagens de referência como se fossem telas implementadas.
- Conferir exigências vigentes de SDK/Android e os avisos do console no upload.
- Concluir configuração do app, enviar para a faixa de teste disponível e coletar feedback. Publicação depende da análise do Google.

## Fontes oficiais

- [Inscrição, idade, taxa e verificação](https://support.google.com/googleplay/android-developer/answer/6112435?hl=pt-BR)
- [Teste de novas contas pessoais](https://support.google.com/googleplay/android-developer/answer/14151465?hl=pt-BR)
- [Verificação de dispositivo](https://support.google.com/googleplay/android-developer/answer/14316361?hl=pt-BR)
- [Requisitos do Play Console](https://support.google.com/googleplay/android-developer/answer/10788890?hl=pt-BR)
