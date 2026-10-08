# Soma / Pulso

Projeto acadêmico com front React Native/Expo e backend em **Node.js puro + MySQL**. Os nomes das variáveis, funções da API, tabelas e mensagens estão em português. O servidor usa `http`, funções e comandos SQL, sem Express ou ORM. A única dependência adicionada ao backend é `mysql2`, para conectar ao MySQL.

Este projeto foi integrado ao [fork da equipe](https://github.com/LIPE308/s0ma), derivado da [base do professor Rodrigo](https://github.com/profRodrigoSenac/projetoIntegrador2026). Os exemplos e serviços originais estão em `examples/`, fora das rotas ativas. Consulte o [relatório da integração](docs/INTEGRACAO.md).

O SOMA recebido usa o backend local de campanhas em `backend/` e `src/servicos/api.ts`. Os serviços de produtos e usuários da API oficial permanecem em `examples/base/rotaServidor/`, junto com `.env.exemplo`, para referência. Essas APIs possuem contratos diferentes; o token da API oficial não substitui uma sessão do SOMA. Migrar os dados e fluxos para o servidor central do professor depende de endpoints compatíveis e não foi realizado nesta integração.

## Executar na web

**No Windows, se já tem MySQL instalado ou recebeu erro do Docker/usuário/senha, siga o [passo a passo do Windows](docs/WINDOWS.md).** Ele permite usar o MySQL local pelo Workbench, sem Docker.

Tenha Node.js 24.19 ou superior e Docker com Compose instalado e aberto. Execute na pasta do projeto:

```bash
npm ci
npm run banco:iniciar
npm run compilar:web
npm run servidor
```

Espere a mensagem **MySQL conectado** e abra `http://localhost:3001` no navegador **do computador onde executou os comandos**. O Node entrega o site e a API no mesmo endereço. A primeira compilação pode demorar. Não é necessário abrir outro servidor Expo para apresentar o projeto.

O MySQL fica na porta 3306. O Compose cria o banco `soma`, o usuário `soma` e a senha local de exemplo `soma_local_123`. Na primeira inicialização, a API cria as tabelas e alguns dados para testar. Os dados ficam no volume `dados_mysql`; reiniciar não apaga os cadastros.

Se a API iniciar antes do MySQL estar pronto, espere o banco terminar de iniciar e execute novamente `npm run servidor`. Se já usa MySQL no computador, veja a [configuração sem Docker](docs/BACKEND.md#usar-mysql-já-instalado).

## Contas de exemplo

Todas usam a senha **academico123**. Também é possível criar uma conta pela tela.

| E-mail | Uso |
| --- | --- |
| `ana@exemplo.com` | Responsável pela biblioteca |
| `marina@exemplo.com` | Responsável pela campanha da família |
| `lucas@exemplo.com` | Responsável pelo abrigo e participante em outras campanhas |
| `admin@exemplo.com` | Analisar denúncias, campanhas e operações de teste |

## Funcionalidades

- Cadastro, login, perfil e encerramento de sessão.
- Criar, consultar, editar e encerrar campanhas com necessidades de objetos, tarefas e dinheiro.
- Reservar, cancelar e confirmar ajudas, incluindo recebimento parcial. Duas reservas não podem ocupar a última unidade ao mesmo tempo.
- Publicar atualizações, consultar atividade, receber avisos e registrar denúncias.
- Administração com permissões verificadas na API.
- Pagamentos e repasses **simulados**, com valores, estados e saldo salvos no MySQL. Nenhum Pix, cobrança, transferência ou reembolso real é executado.

A versão básica não envia e-mail, recupera senhas, analisa conteúdo com IA ou executa o fluxo automático de excedentes. Uma meta fechada recusa pagamentos de teste acima do restante disponível. O front mantém as 35 rotas de referência, com essas limitações explicadas nas telas.

## Para estudar o código

- [backend/servidor.js](backend/servidor.js): recebe requisições, verifica dados/permissões e devolve JSON.
- [backend/banco.js](backend/banco.js): conexão, consultas, transações e dados iniciais.
- [backend/esquema.sql](backend/esquema.sql): tabelas e relacionamentos do MySQL.
- [backend/auxiliares.js](backend/auxiliares.js): validação, senha e leitura do JSON.
- [src/servicos/api.ts](src/servicos/api.ts): o front usa `fetch` para conversar com a API.

[Documentação do backend](docs/BACKEND.md) · [Telas e origem nos slides](docs/FRONTEND.md). Os exemplos anteriores permanecem em `examples/`, fora do aplicativo.

## Desenvolvimento e verificações

Para editar com atualização automática, deixe `npm run servidor` aberto e execute `npm run web -- --localhost --port 8081 --max-workers 2` em outro terminal. Acesse `http://localhost:8081`. Depois das alterações, compile novamente para apresentar pela porta 3001.

```bash
npx tsc --noEmit
npm run lint
npm run testar:backend
```

Os testes de backend precisam do MySQL ligado. Criam e removem um banco separado chamado `soma_teste_...`, com as credenciais locais do Compose; não alteram o banco `soma`. Verificam cadastro, permissões, reservas concorrentes, confirmação parcial, financeiro simulado e persistência após reiniciar o Node. A execução web foi validada; Android/iOS não foram validados.
