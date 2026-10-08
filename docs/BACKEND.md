# Backend acadêmico: Node.js + MySQL

O fluxo é simples: a tela chama `fetch`, o Node recebe uma requisição HTTP, executa SQL no MySQL e responde JSON. Há quatro arquivos principais e um esquema SQL. Não usamos Express, ORM, migrações, filas ou serviços externos. `mysql2` é o driver que permite ao Node acessar o MySQL.

## Executar

No Windows x64, também é possível executar `npm run banco:local`, que inicia um MySQL 8.4.8 próprio do projeto na porta 3307 e configura `backend/.env`. Depois, execute `npm run compilar:web` e `npm run servidor`. Veja os comandos de parada, logs e persistência no [guia do Windows](WINDOWS.md). A API e o esquema são os mesmos em todas as opções.

Na pasta do projeto, com Node.js 24 e Docker Compose:

```bash
npm ci
npm run banco:iniciar
npm run compilar:web
npm run servidor
```

Abra `http://localhost:3001` no computador em que iniciou o servidor. `GET /api/saude` verifica a conexão e devolve `banco: "MySQL"`. O servidor padrão atende apenas esse computador. As contas de exemplo e a senha estão no README.

`compose.yaml` inicia o MySQL 8.4. A API executa `backend/esquema.sql` para criar tabelas ausentes e adiciona exemplos somente quando a tabela `usuarios` está vazia. O volume Docker `dados_mysql` mantém os dados ao reiniciar o Node, o container ou o computador. `docker compose stop` pausa o banco; `npm run banco:iniciar` inicia novamente. Não remova o volume se quiser conservar os dados.

As credenciais locais são exemplos do projeto. Para mudar conexão ou porta, copie `backend/.env.exemplo` para `backend/.env` e ajuste os valores. O arquivo `.env` é ignorado pelo Git.

## Usar MySQL já instalado

No Windows, veja o [guia com os comandos do Prompt e do Workbench](WINDOWS.md).

Use MySQL 8.0.16 ou superior (validado com 8.4), por exemplo pelo MySQL Workbench. Execute o conteúdo de `backend/criar-banco.sql` em uma conexão com permissão para criar banco e usuário. Depois, configure `backend/.env` com o endereço, a porta, o usuário e a senha desse MySQL. Não inicie o Compose neste caso: outro banco pode já estar ocupando a porta 3306.

Execute `npm ci`, `npm run compilar:web` e `npm run servidor`. Não é necessário importar manualmente as tabelas: o servidor cria as que faltam.

## Dados

| Tabela | Conteúdo |
| --- | --- |
| `usuarios` | Nome, e-mail, perfil e resumo da senha |
| `sessoes` | Resumo do token e prazo de validade |
| `campanhas` | História, responsável, organização e estado |
| `necessidades` | Tipo, meta e total recebido |
| `ajudas` | Quem ajuda, quantidade, recebimento e estado |
| `atualizacoes` | Publicações da campanha |
| `pagamentos` | Pagamentos acadêmicos, taxas e líquido |
| `repasses` | Reservas de saldo e decisões de teste |
| `denuncias` | Relatos e estado da análise |
| `avisos` | Avisos da conta e confirmação de leitura |

Dinheiro é um número inteiro em **centavos**: R$ 100,00 = `10000`. Quantidades de objetos e vagas são inteiros. As tabelas têm chaves estrangeiras e restrições básicas.

A senha passa pelo `scrypt` do próprio Node com um sal aleatório. O banco não guarda a senha original. O login cria um token válido por 24 horas; o banco guarda somente seu resumo. O navegador guarda a sessão em `sessionStorage`, até fechar a aba. O logout apaga a sessão no servidor. Nunca enviamos senha ou token por parâmetros de URL.

## Rotas principais

Todos os caminhos abaixo começam por `/api`. Depois do login, o front envia `Authorization: Bearer TOKEN` nas rotas autenticadas.

| Método e caminho | Resultado |
| --- | --- |
| `GET /saude` | Confere servidor e MySQL |
| `POST /cadastro` | Cria conta com nome, e-mail e senha |
| `POST /login`, `POST /sair` | Inicia ou encerra sessão |
| `GET /perfil`, `PUT /perfil` | Consulta ou salva o próprio perfil |
| `GET /campanhas`, `POST /campanhas` | Lista campanhas públicas ou cria campanha |
| `GET /campanhas?minhas=1` | Lista as próprias campanhas |
| `GET /campanhas/:id`, `PUT /campanhas/:id` | Detalhes ou edição pelo responsável |
| `PATCH /campanhas/:id/encerrar` | Encerra e conserva o histórico |
| `GET /necessidades`, `GET /necessidades/:id` | Lista ou detalha pedidos |
| `POST /ajudas`, `GET /ajudas/:id` | Reserva ou acompanha ajuda |
| `PATCH /ajudas/:id/cancelar` | Cancela a parte ainda pendente |
| `PATCH /ajudas/:id/confirmar` | Responsável registra o total recebido |
| `GET /campanhas/:id/ajudas` | Responsável consulta ajudas |
| `GET /atividade` | Ajudas, campanhas e pagamentos da conta |
| `GET /campanhas/:id/atualizacoes`, `POST /campanhas/:id/atualizacoes` | Consulta ou publica atualização |
| `GET /avisos`, `PATCH /avisos/:id` | Consulta ou marca leitura |
| `POST /denuncias` | Salva relato para análise |
| `GET /administracao` | Painel exclusivo do administrador |
| `PATCH /administracao/campanhas/:id` | Publica, suspende ou solicita ajustes |
| `PATCH /administracao/denuncias/:id` | Marca denúncia como analisada |
| `POST /pagamentos`, `GET /pagamentos/:id` | Cria ou acompanha pagamento de teste |
| `PATCH /pagamentos/:id/simular` | Confirma, cancela ou registra reembolso simulado |
| `GET /campanhas/:id/saldo` | Calcula saldo acadêmico |
| `POST /repasses`, `GET /repasses/:id` | Solicita ou acompanha repasse de teste |
| `PATCH /repasses/:id/cancelar` | Solicitante libera a reserva de saldo |
| `PATCH /repasses/:id/decidir` | Administrador conclui ou recusa no sistema |

`servidor.js` reúne as rotas por assunto e usa funções pequenas para conferir login, responsável e administrador. As consultas recebem valores em `?`, evitando concatenar entradas do formulário com SQL.

## Regras que são verificadas no servidor

Reservar não soma ao recebido. O disponível é `meta - recebido - reservado`. A transação bloqueia a campanha e o pedido antes de reservar; uma segunda reserva enxerga a primeira. A confirmação recebe o **total acumulado**, soma apenas a diferença e não conta duas vezes ao repetir. O responsável usa outra conta para oferecer ajuda à sua própria campanha; somente ele confirma a ajuda de outra pessoa. No cancelamento parcial, o total já recebido continua salvo.

Campanhas com histórico não podem perder seus pedidos. Encerrar conserva todos os registros e impede novas ajudas. Apenas o responsável ou administrador pode editar; visitantes não consultam campanhas suspensas ou em ajustes. Novas contas nunca recebem permissão de administrador pelo formulário.

Nos pagamentos acadêmicos, a taxa Soma é 4% e a tarifa fictícia é R$ 3. O líquido entra na meta somente após confirmação. Pagamentos pendentes reservam o restante da meta fechada. Repasses solicitados reservam saldo; cancelar libera essa reserva. Repasses concluídos reduzem o saldo disponível, preservando a arrecadação registrada na meta. O reembolso de teste exige administrador e saldo disponível suficiente. Confirmações repetidas não duplicam valores.

Esses cálculos e estados persistem no MySQL, mas **não movimentam dinheiro**. Não há gateway financeiro, envio de e-mail, recuperação de senha, IA ou automatização de excedentes/prazos nesta versão básica.

## Testar

Para o MySQL próprio do Windows: `npm run banco:local` e `npm run testar:backend:local`. A suíte foi executada contra MySQL 8.4.8 real: **8 testes passaram**, incluindo reservas concorrentes, rollback, permissões, financeiro simulado e persistência após reiniciar a API.

```bash
npm run banco:iniciar
npm run testar:backend
```

Os testes usam os recursos nativos `node:test`, `assert` e `fetch`. Criam um banco temporário `soma_teste_...`, iniciam um Node separado, verificam os fluxos e removem apenas esse banco no final. Por padrão, usam o administrador local do Compose. Para outro MySQL, configure `MYSQL_TESTE_USUARIO` e `MYSQL_TESTE_SENHA` com credenciais que possam criar/remover bancos de teste. Essas credenciais são usadas somente nos testes; a aplicação normal usa `soma`.

## Desenvolvimento web

Na porta 3001, o Node serve a pasta `dist`, criada por `npm run compilar:web`. A saída web é `single`: as rotas são carregadas no navegador, junto com a sessão, sem pré-renderizar uma página de visitante para uma conta já conectada. Ao editar telas, compile novamente ou use Expo na porta 8081 em outro terminal. Nesse endereço, o front chama a API na porta 3001. No site compilado, chama `/api` no mesmo endereço do site.

Para usar outro endereço de API ou um aparelho, defina `EXPO_PUBLIC_URL_BACKEND` antes de iniciar/compilar o Expo, por exemplo `http://IP_DO_COMPUTADOR:3001/api`. Ajuste também `ENDERECO` do Node e `ORIGEM_WEB` se necessário. Essa execução em aparelho ou endereço externo não foi validada. Uma URL `localhost` neste ambiente de nuvem não é um link público para o usuário.
