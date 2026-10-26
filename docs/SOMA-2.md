# SOMA 2.0 — implementação, regras e entrega

> Atualização visual de 26/10/2026: [reformulação em azul](REFORMULACAO-AZUL.md). Entrada, sessão web, criação em quatro etapas e acompanhamento 2D substituem as descrições de som, estrada 3D e navegação anteriores neste documento. As regras de revisão, urgência e fundo permanecem.

Atualização do briefing de 22/10/2026, preservando a base 6bf9b56, o azul royal, React Native/Expo, Node HTTP e MySQL. A auditoria e o plano anteriores às alterações estão em [SOMA-2-PLANO.md](SOMA-2-PLANO.md). Não há implantação pública ou movimentação financeira real.

## Integração com a main de 26/10/2026

A main recebeu os commits bcb3dc8 a 6d63efd enquanto esta atualização era desenvolvida. A integração conserva a criação financeira em três passos, o calendário, a aba Minhas rotas, a entrada de contribuições simplificada e a estrada 3D com alternativa leve/lista. Os fluxos adicionais de objetos, tarefas e múltiplas metas continuam disponíveis. As rotas /rota e /rota-inteligente usam a mesma tela e fonte de dados.

O backend novo concentra os critérios de urgência, documentos privados, revisão prévia, conciliação e razão contábil. /campanhas/:id/inteligencia é uma leitura compatível dos mesmos valores; não soma novamente os anúncios. As operações antigas de rateio em uma etapa, perfil e upload sem preparação retornam 410 e apontam para os fluxos atuais. Não há dois motores financeiros ativos.

A migração 003-integracao-main amplia perfis sem remover colunas antigas; preserva biografia e importa JPEG/PNG, identidades Google, UF explicitamente autorizada e distribuições publicitárias anteriores uma única vez. Os créditos antigos são incorporados às necessidades e lançamentos, com referência à fonte, sem repetir a arrecadação efetiva. As tabelas originais continuam intactas. Imagens antigas fora dos formatos válidos permanecem na origem e exigem novo envio; perfis importados ficam privados até nova autorização e declaração de maioridade. Revisões de urgência anteriores ficam no histórico privado; a prioridade exige os critérios/evidências atuais.

## O que funciona

- Novas campanhas são rascunhos privados. O responsável prepara imagem, evidências opcionais, localização autorizada e pedido de urgência; envia para análise. A administração publica ou pede ajustes/suspende. Campanhas antigas ativas foram preservadas.
- Necessidades continuam independentes: dinheiro, objetos e tarefas, inclusive campanhas de um único tipo e vários pedidos do mesmo tipo. Nenhuma meta financeira artificial é exigida para campanhas só de objetos.
- Finalidades pessoais, individuais e institucionais são aceitas. Prazo e texto de região pública tornaram-se opcionais; urgência exige um prazo verificável.
- A Rota Inteligente conserva a estrada 3D e oferece uma trilha leve com pontos conectados, etapas concluídas/atuais/futuras e detalhes ao selecionar um marco. Acompanha o progresso confirmado e a origem dos recursos.
- Anúncios solidários têm espaço visual, transparência pública e painel administrativo de **simulação**: receita pendente, conciliação, distribuição, lançamentos e auditoria.
- O Mapa Solidário usa cartografia oficial do IBGE empacotada no app, zoom, movimentação opcional, seleção por UF/município e filtro de categoria. Só entra campanha ativa com consentimento explícito para estado/município.
- Descoberta avançada por urgência revisada, categoria, UF, meta, prazo revisado, recentes, proximidade da meta e pouca visibilidade.
- Perfis de pessoa/instituição com foto, capa, biografia, cor, conquistas baseadas em registros, campanhas e preferências de privacidade. Histórico financeiro permanece privado e reaproveita a atividade existente.
- Documentos privados só são consultados pelo responsável e pela administração, com registro de acesso. Nenhum documento é anexado à resposta pública da campanha.
- Login Google web foi estruturado com a biblioteca oficial, PKCE, state, nonce e identidade persistente. **Está desativado sem credenciais reais e não foi validado com uma conta Google.** O login por senha continua funcionando.

A Rota Inteligente não é uma aplicação financeira nem um redirecionador automático de excedentes. Meta fechada continua recusando novas contribuições acima do restante reservado/disponível.

## Novas telas e pontos de entrada

| Rota | Uso |
| --- | --- |
| /rota | Escolher campanha e acompanhar a trilha |
| /rota?id=ID | Rota de uma campanha |
| /mapa | Mapa agregado e descoberta por estado |
| /descoberta | Filtros avançados e feed equilibrado |
| /preparar-campanha?id=ID | Imagem, documentos privados, consentimento e envio |
| /urgencia?id=ID | Solicitação, resultado, recurso e histórico privado |
| /personalizar-perfil | Perfil e privacidade da própria conta |
| /perfil-publico?id=ID | Perfil autorizado, sem telefone/e-mail |
| /transparencia-anuncios | Regras e totais simulados do fundo |
| /fundo-solidario | Receitas, urgências, lançamentos e auditoria administrativa |
| /google | Conclusão do acesso Google web, sem bearer token na URL |

Início oferece Rota Inteligente e Mapa Solidário. Campanhas com meta financeira abrem sua rota pelos detalhes ou gerenciamento. A administração existente abre o fundo e consulta documentos/urgência na análise da campanha.

## Urgência: regras objetivas, versão urgencia-1

| Critério | Pontos |
| --- | --- |
| Natureza | Vida 30; moradia/alimentação 20; educação 10; outras 0 |
| Prazo vigente | Até 2 dias: 25; até 7: 20; até 30: 10; demais: 0 |
| Consequências descritas | 10 para descrição com ao menos 30 caracteres; declaração exige revisão humana |
| Evidência revisada e válida | 20 somente quando a administração confirma validade |
| Lacuna relativa de recursos | 15 se >=75%; 8 se >=25%; 0 abaixo |

Lacuna = max(0, (meta financeira - recebido - recursos disponíveis declarados) / meta). Valor absoluto alto, seguidores e popularidade não aumentam a pontuação.

Recomendação: crítica a partir de 70 pontos, moderada a partir de 40, regular abaixo. Prazo vencido sempre recomenda regular. A recomendação automática é informativa; **não concede destaque ou crédito**.

Para conceder prioridade, um administrador distinto do responsável precisa examinar documento privado, confirmar evidência, informar validade e fundamentação. Crítica exige recomendação compatível; moderada exige ao menos 40 pontos. O destaque só vale enquanto prazo e evidência estiverem vigentes. Expiração é calculada em cada consulta/distribuição, sem depender de cron.

Recurso e nova solicitação retiram prioridade até nova revisão. Edição da campanha invalida a análise anterior; seu histórico é mantido. A versão inicial não usa IA paga, diagnóstico automático ou selo de autenticidade de beneficiário/instituição.

O feed equilibrado intercala crítica revisada, recente e pouco visualizada. A visualização é aproximada e deduplicada por navegador/dia, sem guardar endereço IP na tabela. Não é contagem certificada de pessoas nem critério de acesso ao fundo.

## Fundo publicitário: versão fundo-1

1. Operador registra **receita de teste** com referência única, bruto, tributos, custos publicitários e justificativa.
2. Enquanto pendente, nenhum crédito é produzido.
3. Operador confirma conciliação da receita simulada.
4. Líquida = bruto - tributos - custos; os valores devem ser inteiros não negativos e deduções não podem superar o bruto.
5. Fundo = floor(líquida × 70 / 100); operação recebe a diferença, preservando todos os centavos.
6. Participam campanhas ativas, de responsável adulto, com urgência crítica revisada vigente, documento privado revisado e meta financeira livre. Pagamentos pendentes já reservam seu espaço e são descontados.
7. A campanha do próprio operador não recebe créditos naquela operação.
8. Uma campanha por responsável é escolhida, por prazo e lacuna. Peso = fator de prazo × lacuna relativa / (1 + créditos anteriores do responsável / R$ 100).
9. Fator de prazo: 3 até 2 dias, 2 até 7 dias, 1 nos demais. Lacuna é a proporção ainda livre em relação à meta, limitada a 0,01–1.
10. Cada responsável recebe no máximo **35% do fundo daquela receita**, também limitado ao restante das metas.
11. O rateio proporcional usa centavos inteiros, redistribui sobras dentro dos tetos e resolve empates por identificador estável.
12. Cada crédito é gravado junto da distribuição, lançamento e progresso, numa transação. Referências e chaves de idempotência impedem duplo crédito.
13. Receita distribuída não pode ser distribuída de novo. Sobras permanecem retidas; não existe redistribuição automática nem conversão em receita nova.

Com um único destinatário, no máximo 35% do fundo é alocado; com nenhum elegível, nada é creditado e a receita continua conciliada. A limitação por responsável reduz vantagem de campanhas duplicadas da mesma conta, mas não detecta uma pessoa usando várias identidades. Isso exige investigação e política operacional.

Não há SDK de anúncios ativo, remuneração por impressão ou incentivo a cliques artificiais. Para um provedor futuro, o contrato necessário é: importar referência única e receita efetivamente confirmada, validar a origem/assinatura e conciliar deduções antes de liberar a distribuição. A integração real permanece bloqueada, sem aceitar modo real no endpoint atual.

## Valores e projeções

Centavos são inteiros. A trilha separa:
- Confirmado na meta: recebido nas necessidades financeiras.
- Disponível: confirmado menos repasses concluídos e solicitações reservadas.
- Doações: pagamentos atualmente confirmados.
- Anúncios: lançamentos efetivamente creditados **na simulação**.
- Saldo histórico: diferença importada da base anterior, sem fingir que houve novas doações.
- Aplicado e rendimentos realizados: zero, pois não existe prestador de investimentos.

Lançamentos registram saldo legado, doação, estorno, crédito de anúncio e repasse. O progresso da meta não diminui quando um repasse é concluído; o disponível diminui. Reembolsos simulados autorizados reduzem o recebido e geram estorno único.

Projeção de doações exige pelo menos 3 registros confirmados em 3 dias distintos, cobrindo ao menos 7 dias dentro da janela dos últimos 30. A publicidade exige 2 créditos em dias distintos e ao menos 7 dias de observação. Sem dados, retorna null e a tela mostra estimativa indisponível.

A hipótese é explícita: manutenção da cadência histórica, sem garantia de contribuições futuras. Isso não é previsão estatística validada ou promessa de retorno.

O cenário educativo só usa taxa/custos informados pelo usuário, com limites de entrada e sem produto indicado. Não credita o resultado nem realiza aplicação. Campanhas críticas ou com uso em até 7 dias priorizam liquidez; o cenário de rendimento fica bloqueado.

## Mapa e privacidade

A geometria vem da [API de Malhas do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3), com identificadores da [API de Localidades](https://servicodados.ibge.gov.br/api/v1/localidades/estados). É um recurso estático em src/data/mapa-brasil.json; o usuário não precisa chamar essas APIs ao abrir a tela.

Indicador por UF = soma dos pesos por campanha: 3 crítica revisada, 1,5 moderada ou 0,5 regular; até 3 pontos pela lacuna financeira; +1 por prazo revisado de até 7 dias.

O mapa representa somente campanhas cadastradas que autorizaram localização aproximada. Não representa a necessidade social da população, estatística oficial de vulnerabilidade ou endereço do beneficiário. O campo de município recusa rua/número. Não há GPS, coordenada residencial ou mapa externo pago.

Foto pública depende de consentimento, finalidade e vínculo à campanha/perfil atual. Documentos permanecem privados. Arquivos aceitos: JPEG/PNG e PDF para documentos, até 2 MB, máximo 50 arquivos por conta; o servidor verifica assinatura/estrutura, limita dimensões e remove metadados de imagens. Isso não anonimiza o conteúdo visual nem substitui análise antimalware. PDF é baixado como arquivo, não executado/embutido como HTML.

Perfil público/local/apoios são opt-in. Declaração de menoridade força perfil privado e retira campanhas ativas para revisão. Não coletamos data de nascimento ou documentos pessoais obrigatórios. A declaração não comprova idade; não há cadastro formal de responsável legal ou verificação etária.

Esses controles apoiam privacidade, mas **não certificam conformidade com a LGPD**. Antes de operação real, ainda são necessários responsável pelo tratamento, bases legais, políticas de retenção/exclusão, atendimento a titulares, proteção de menores e avaliação jurídica.

## Banco e reversão

A API cria automaticamente as tabelas da extensão anterior, conserva suas fontes e acrescenta o esquema de 14 tabelas (perfis é compartilhada) por backend/esquema-soma2.sql: migrações, perfis, detalhes de campanha, arquivos, urgências, histórico de urgência, auditoria, receitas, distribuições, lançamentos, visualizações, identidades e os dois estados temporários OAuth.

Não remove ou recria tabelas existentes e não troca senhas. A migração 002-lancamentos faz importação única dos saldos e operações legados. A marcação transacional impede repetição ao reiniciar ou configurar outro administrador.

Datas antigas desconhecidas de recebimentos não são inventadas: saldos importados são identificados como históricos. A escrituração anterior não pode ser reconstruída além dos registros que já existiam.

Reversão segura: mantenha backup, pare o Node e retorne ao commit anterior da aplicação, conservando as tabelas extras e seus registros. O esquema original permanece compatível; não execute DROP para “voltar” e não reverta créditos apagando dados. A reversão de código também reverte políticas novas de publicação/acesso, portanto exige avaliação do operador. Não existe rollback automático de operações financeiras ou de arquivos já utilizados.

## Google: configuração pendente

O fluxo web usa [google-auth-library e OAuth de servidor](https://developers.google.com/identity/protocols/oauth2/web-server) com [OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect):
1. Criar projeto e tela de consentimento no Google Cloud, cadastrar usuários de teste se necessário.
2. Criar cliente OAuth do tipo aplicação web.
3. Autorizar exatamente http://localhost:3001/api/auth/google/callback no desenvolvimento; usar HTTPS no ambiente público.
4. Preencher apenas backend/.env com GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI.
5. Reiniciar o Node, abrir o login e validar com uma conta Google autorizada.

Client secret nunca entra em EXPO_PUBLIC_ ou bundle. Não há bearer token na URL de retorno: o backend usa cookie temporário HttpOnly e troca única para iniciar a sessão. state protege o navegador; PKCE protege a troca; nonce, assinatura e audience são verificados pelo fluxo e biblioteca oficial.

E-mail coincidente não vincula silenciosamente uma conta existente. O usuário entra por senha e escolhe vincular Google no perfil. Android/iOS exigem clientes e configuração próprios e um build nativo; **o botão Google desta entrega é web**. Não declaramos login Google real testado.

## Testes, limites e operação

A suíte soma regras puras, jornadas MySQL do SOMA 2.0 e regressões anteriores. Fixtures aprovadas da suíte antiga agora passam explicitamente pela nova revisão; a suíte nova verifica o estado antes da aprovação.

Há testes de recomendação sem privilégio, documentação insuficiente, validade/prazo vencidos, duplicatas, usuário comum em administração, arquivo de terceiros, receita pendente, meta atingida, teto de concentração, concorrência, duplo crédito, ausência de elegíveis, projeção sem histórico, perfil de menor e reinício sem repetir lançamentos.

Comandos:
    npm run banco:local
    npm run testar:backend:local
    npx tsc --noEmit
    npm run lint
    npm run compilar:web

Projeções de novas contribuições são suspensas fora da arrecadação ativa. Quando a cadência disponível não alcança a meta no prazo declarado, há alerta explícito.

As exportações Android/iOS verificam bundles, não execução em aparelhos. Os resultados finais e a inspeção web são registrados no relatório de validação desta entrega.

Limites operacionais: não há provedor de anúncios real, investimentos, verificação independente de necessidade/identidade, IA de moderação, antivírus, resolução formal de conflitos, equipe de atendimento, teste de carga ou validação de mercado. Moderação de conteúdo perigoso, sexual explícito, enganoso ou proibido depende da revisão humana antes de publicar e das denúncias após a publicação. Não há classificador automático de imagens/conteúdo.

Não acrescente credenciais ou dados demonstrativos ao Git. Os exemplos usados para inspeção visual são criados num banco temporário separado, removido depois da validação. Para autorizar um administrador real da apresentação, cadastre a conta e use o comando local descrito no README.
