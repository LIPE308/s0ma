# Pagamentos reais e publicação nas lojas

Decisão do responsável em 30/10/2026: o pagamento deve ser recebido diretamente por cada beneficiário por meio de um provedor. O SOMA não deve receber as doações em uma conta própria para depois repassá-las.

## Estado atual

O APK 1.0.1, o backend público e os registros financeiros existentes continuam sendo demonstrativos. Nenhuma cobrança real, transferência ou devolução foi implementada ou ativada. Não converter saldos e confirmações simuladas em dinheiro real.

Ainda não existem conta de pagamentos, CNPJ/ONG responsável nem contas de desenvolvedor Google Play/Apple informadas pelo responsável. O provedor de pagamentos ainda não foi escolhido. Não existe aprovação comercial para operar arrecadação no Brasil.

## Fluxo a implementar após escolher um provedor que aceite o SOMA

1. Cada beneficiário conclui o cadastro e a verificação de identidade no próprio provedor. O servidor vincula o identificador da conta aprovada ao responsável pela campanha. Dados bancários, documentos e credenciais não devem ficar públicos nem no APK.
2. O servidor valida a campanha, o beneficiário e o valor em centavos e cria um pagamento para a conta do beneficiário com chave de idempotência. O cliente não escolhe livremente o recebedor. O cadastro deve definir quem responde por taxas, estornos e contestações.
3. O doador conclui o pagamento em checkout do provedor, sem dados de cartão armazenados pelo SOMA. Retornar ao aplicativo não confirma recebimento.
4. O backend valida a assinatura do webhook e consulta o pagamento no provedor. Confere conta recebedora, referência, valor, moeda e estado antes de registrar o crédito uma única vez em transação no Supabase.
5. Reembolsos, contestações e eventos fora de ordem devem ser conciliados sem duplicar lançamentos. Apenas a confirmação real do provedor altera a meta real da campanha.
6. Usar registros separados para pagamentos reais e demonstrações. No modelo direto, as doações não compõem um saldo sacável pelo SOMA nem passam pela fila atual de repasses simulados. O fundo de anúncios precisa de integração e conciliação próprias.

Os testes de homologação devem cobrir webhook falso, repetição, valor/recebedor divergente, timeout, concorrência, pagamento recusado, estorno e contestação antes de habilitar produção.

## Provedor: decisão comercial pendente

O Mercado Pago documenta marketplace com recebimento nas contas dos participantes e autorização OAuth. Essa documentação descreve vendas de produtos/serviços; não confirma, por si só, aprovação para campanhas solidárias do SOMA. Consultar o provedor sobre arrecadação por pessoas físicas, campanhas beneficentes, cadastro dos recebedores e condições comerciais antes de integrar produção.

A Stripe classifica crowdfunding/arrecadação como atividade restrita e publica restrições por país. Não assumir que criar uma conta Stripe ou integrar Connect autoriza o SOMA no Brasil.

Não foi cadastrado nenhum serviço pago, aceita nenhuma contratação ou solicitada chave privada pelo chat.

## Preparação das lojas

O perfil EAS `production` usa distribuição `store`, AAB Android e a API HTTPS pública. O identificador iOS proposto é `com.soma.pulso`; sua disponibilidade ainda precisa ser confirmada na conta Apple. Os perfis `grupo` e `preview` continuam sendo de testes. Configuração de build não significa que o aplicativo foi publicado ou aprovado.

Antes da submissão: confirmar titular e tipo das contas, identificadores, assinatura, versão/build exclusivos, política de privacidade pública, suporte, exclusão de conta, declarações de dados/anúncios, moderação e teste com aparelhos Android/iPhone. A Apple exige tratamento específico para arrecadações beneficentes; as regras para doações a organizações e presentes entre pessoas são diferentes. Não presumir que todas as campanhas atuais se enquadram na mesma exceção.

As lojas oferecem cadastro de desenvolvedor individual e de organização, com exigências diferentes. A ausência de CNPJ não impede por si só o cadastro individual, mas tampouco resolve a elegibilidade comercial do modelo de arrecadação. Inscrição, taxas e contratos serão concluídos pelo titular; nenhuma compra foi autorizada nesta etapa.

## Fontes oficiais consultadas em 30/10/2026

- [Marketplace Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/how-tos/integrate-marketplace)
- [Atividades restritas Stripe](https://stripe.com/legal/restricted-businesses)
- [Apple: regras de revisão, seção 3.2](https://developer.apple.com/app-store/review/guidelines/#other-business-model-issues)
- [Apple: inscrição de desenvolvedor](https://developer.apple.com/programs/enroll/)
- [Google Play: tipos de conta](https://support.google.com/googleplay/android-developer/answer/13634885)
- [Expo: perfis de compilação](https://docs.expo.dev/build/eas-json/)
