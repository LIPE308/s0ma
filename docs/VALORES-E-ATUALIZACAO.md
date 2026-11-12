# Valores, atualização automática, fotos e publicação regular

## Campo monetário
Doação e solicitação de repasse usam CampoDinheiro, com prefixo R$, entrada somente numérica, separador de milhares e dois centavos com vírgula. Letras são removidas da entrada controlada; o servidor continua validando centavos inteiros, mínimo, máximo e idempotência. A doação simples valida R$ 10 até R$ 1.000.000.

## Saldo registrado e projeção
A projeção não grava nada no banco. Atualiza a cada oito segundos, com incrementos menores; doações projetadas ocorrem em blocos de seis etapas e rendimentos em quinze. Não há botão de pausa/reinício: o contador inicia automaticamente, suspende fora de foco/segundo plano e encerra em 60 etapas. O saldo registrado continua separado da estimativa.

useDados agora admite atualização contínua explícita. Campanha, início, listas de causas e resumo/listas administrativas consultam novamente a cada 15 segundos, somente enquanto visíveis. Reconsultam também ao voltar à tela e após mutações financeiras confirmadas neste cliente. Não apagam o conteúdo durante atualização e não fazem requisições periódicas sobrepostas. Formulários de edição não participam desse modo, preservando os campos. Outros dispositivos recebem mudanças na próxima consulta, em até aproximadamente 15 segundos quando a rede responde normalmente; não se trata de WebSocket.

A visão geral administrativa separa doações confirmadas, receita líquida publicitária conciliada e saldo registrado nas campanhas. Projeções não são somadas à arrecadação. A confirmação concorrente de uma mesma doação continua contabilizada uma única vez.

## Fotos
A lista administrativa retorna avatar e foto Google somente após exigir administrador. Arquivos privados continuam usando a API autenticada. O avatar cadastrado tem prioridade; foto Google aparece quando autorizada, e quem não cadastrou foto recebe iniciais. Prévia do avatar no primeiro perfil e na personalização usa tamanho quadrado com raio de metade da altura, exibindo recorte circular.

## Campanhas comuns
Regra explicitamente autorizada pelo usuário: após envio por responsável maior de idade, a campanha regular inicial fica ativa e aparece em Causas. Salvar rascunho continua privado. Selo crítico, evidências, prioridade financeira e revisão de urgência permanecem administrativos. Campanhas suspensas, devolvidas para ajuste ou que já foram retiradas de publicação para moderação não contornam a revisão. Reenviar uma campanha já ativa é idempotente.

backend/publicar-campanhas-enviadas.js aplica a mesma regra no MySQL local apenas a campanhas já submetidas, com adulto confirmado, conta não bloqueada e sem retirada anterior por moderação. A execução autorizada publicou cinco registros existentes, sem mudar saldos ou conceder urgência. Não publica rascunhos ainda não enviados.

## Verificação
54 testes isolados MySQL passaram, incluindo publicação regular, recusa de menor/não responsável, preservação de suspensão e diferença exata de 2.000 centavos no total da campanha e do painel após confirmação concorrente. Sete testes de máscara/projeção/fotos passaram, além de tipos, lint e exportações web raiz e /soma.

No navegador, letras não permaneceram no campo e R$ 1.234,56 resultou em 1.234,56; a letra digitada depois não alterou o valor. Com resposta de consulta interceptada apenas para o teste, o saldo refletiu uma mudança na segunda consulta sem recarregar, e não existia botão de pausa. Prévia de imagem mediu 120 × 120 com raio 60 px. Interceptações foram removidas depois; não foram feitas doações reais nem gravadas doações adicionais para esses testes visuais. A API administrativa pública autenticada retornou metadados de foto e os novos totais. Publicidade e pagamentos permanecem no modo simulado existente.

## Ajustes de publicação e acompanhamento

Todos os campos monetários usam máscara BRL; campos numéricos genéricos descartam letras. O cabeçalho consulta o perfil atual ao voltar à tela e em intervalos de 15 segundos. Após envio de campanha comum, a navegação abre Causas com os filtros limpos. Reenvios sujeitos à moderação continuam aguardando revisão.

O painel apresenta uma projeção de potencial publicitário calculada sobre atividade persistida: um centavo por visualização e dois por compartilhamento, divididos em 70% de apoio e 30% de operação. Esses parâmetros são hipóteses de apresentação, não dados de um provedor. A projeção é somente leitura e não gera receita conciliada, saldo ou distribuição. O histórico mantém os valores efetivamente registrados separados.
