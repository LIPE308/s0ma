# Validação do backend e MySQL

Executada em 08/10/2026 no Windows, com MySQL Community 8.4.8 real e API Node na porta 3001. O banco usa InnoDB, UTF-8, dez tabelas relacionadas e transações. O front acessou a API sem interceptação ou respostas simuladas.

## Regressão da API

`npm run testar:backend:local`: **8 testes passaram, nenhum falhou**. A suíte cria e remove somente um banco `soma_teste_...`; não altera o banco normal `soma`.

- Cadastro, hash de senha, login/logout, expiração de sessão, SQL parametrizado e permissões.
- Criação, edição e consulta de campanhas; rollback quando uma operação falha.
- Reservas simultâneas: somente uma pessoa obtém a última unidade.
- Recebimento parcial, cancelamento, participação em ação, atualizações e avisos.
- Pagamento simulado, limites, confirmação idempotente, repasse e reembolso.
- Administração, suspensão, denúncia e encerramento mantendo histórico.
- Reinício da API mantendo cadastro, sessão, campanhas, ajudas e financeiro.

## Interface e reinício do banco

No Edge, em 390 × 844 pixels: cadastro pela tela, sessão, campanha nas quatro etapas, publicação de atualização, edição do telefone, recarga com o perfil preservado e logout. Nenhum erro JavaScript de página.

O MySQL foi encerrado com `npm run banco:local:parar` e iniciado novamente com `npm run banco:local`. A API reconectou sem reinício. A campanha, publicação e telefone criados pela validação permaneceram gravados, e o login continuou funcionando. Os registros desse teste foram removidos por UUID e e-mail; os exemplos originais foram preservados.

Executar `npm run banco:local` com o banco já ativo também funcionou. O comando confirma a identidade do diretório de dados antes de usar uma porta ocupada. A parada espera o processo encerrar por completo, evitando iniciar enquanto o InnoDB ainda libera seus arquivos.

TypeScript, lint, verificação de sintaxe do script e `git diff --check` passaram. O banco e as credenciais locais estão ignorados pelo Git. Pagamentos e repasses continuam acadêmicos: nenhum dinheiro real é movimentado.
