# Executar no Windows com MySQL

O front e a API precisam de um servidor MySQL funcionando. Escolha uma das três opções abaixo. O Workbench é somente um cliente; ele não substitui o servidor.

## MySQL próprio do projeto: sem Docker

Em Windows x64, com Node.js 24.19 ou superior, execute na pasta do projeto:

```bat
npm ci
npm run banco:local
npm run compilar:web
npm run servidor
```

Abra `http://localhost:3001`. A primeira execução baixa aproximadamente 248 MB do servidor oficial **MySQL Community 8.4.8 LTS**, verifica o SHA-256, extrai e inicializa dentro de `backend/.mysql`. Requer internet na primeira instalação; não instala serviço do Windows. O MySQL fica em segundo plano, restrito a `127.0.0.1:3307`, e a API usa o usuário `soma`, com permissão somente no banco `soma`.

As senhas do administrador local e do usuário `soma` são geradas aleatoriamente. Ficam nos arquivos ignorados `backend/.mysql/configuracao.json` e `backend/.env`; não devem ser compartilhadas ou commitadas. O script recusa usar uma porta ocupada por outro MySQL e preserva um `.env` que configure outro banco. Não substitua esse `.env` pelo exemplo da porta 3306.

```bat
npm run banco:local:estado
npm run testar:backend:local
npm run banco:local:parar
```

O teste cria e remove apenas seu banco temporário. O comando de parada preserva `backend/.mysql/dados`. Após reiniciar o computador, rode `npm run banco:local` e `npm run servidor` novamente. Não exclua a pasta de dados ou a configuração se quiser conservar os cadastros. Logs do banco: `backend/.mysql/mysql.log`.

O pacote e a versão são fixados em `backend/mysql-local.js`, com SHA-256. Documentação oficial: [instalação com ZIP no Windows](https://dev.mysql.com/doc/refman/8.4/en/windows-installation.html) e [arquivo oficial usado](https://cdn.mysql.com/archives/mysql-8.4/mysql-8.4.8-winx64.zip). Este modo serve ao desenvolvimento e à apresentação local; para hospedar o projeto, configure seu próprio servidor MySQL.

## Opção 1: usar o MySQL já instalado

O erro `ER_ACCESS_DENIED_ERROR` indica que um servidor MySQL respondeu no endereço configurado. Use a conexão desse servidor no MySQL Workbench. O Workbench é um cliente; quem precisa estar funcionando é o serviço MySQL.

1. Abra o Workbench e entre na conexão **local**, usando sua conta administradora (geralmente `root`) e a senha que definiu ao instalar o MySQL.
2. Abra `backend/criar-banco.sql` pelo menu **File > Open SQL Script** e execute o arquivo inteiro pelo botão do raio. Ele cria o banco `soma`, o usuário do projeto e suas permissões nesse banco. Não apaga tabelas ou dados.
3. Na pasta do projeto, abra o Prompt de Comando e execute:

```bat
copy backend\.env.exemplo backend\.env
npm run servidor
```

A cópia deve ser feita quando `backend/.env` ainda não existe, como no log enviado. Se você já o criou e configurou, mantenha o arquivo e confira os valores.

A configuração padrão é:

```dotenv
MYSQL_HOST=127.0.0.1
MYSQL_PORTA=3306
MYSQL_USUARIO=soma
MYSQL_SENHA=soma_local_123
MYSQL_BANCO=soma
PORTA=3001
ENDERECO=127.0.0.1
```

Se a conexão do Workbench usa outra porta, ajuste `MYSQL_PORTA`. Se o usuário `soma` já existia, o script não troca sua senha: configure `MYSQL_SENHA` com a senha desse usuário ou use as credenciais de uma conta com permissão no banco `soma`. Para editar:

```bat
notepad backend\.env
```

Espere **MySQL conectado** e abra `http://localhost:3001` no navegador. Deixe o terminal do servidor aberto. Você não precisa executar `npm run banco:iniciar` quando usa esse MySQL instalado.

Como a instalação e a compilação já terminaram no seu log, não precisa repetir esses comandos. Para uma pasta nova sem dependências, execute `npm ci`. Depois de editar as telas, execute `npm run compilar:web` novamente.

## Opção 2: usar MySQL pelo Docker Desktop

Abra o **Docker Desktop** pelo menu Iniciar e espere aparecer que o Engine está funcionando. O comando `docker` instalado sozinho não inicia o Engine. Confirme no terminal:

```bat
docker info
```

Depois, na pasta do projeto:

```bat
npm run banco:iniciar
npm run servidor
```

Se já existe um MySQL local na porta 3306, use a opção 1. Iniciar outro MySQL nessa mesma porta pode produzir um erro de porta ocupada. Se o Docker Desktop não consegue iniciar, veja o erro exibido pelo próprio aplicativo; o log enviado não informa a causa desse problema.

## Entender as mensagens

| Mensagem | Como resolver |
| --- | --- |
| `docker_engine ... The system cannot find the file specified` | Abra o Docker Desktop e espere o Engine iniciar, ou use o MySQL instalado |
| `ER_ACCESS_DENIED_ERROR` | Confira usuário/senha e execute `backend/criar-banco.sql` como administrador no MySQL correto |
| `ER_BAD_DB_ERROR` | Crie o banco pelo script e confira `MYSQL_BANCO` |
| `ECONNREFUSED` | Inicie o serviço MySQL e confira host/porta; no Windows, abra `services.msc` e procure o serviço MySQL |
| `backend/.env not found. Continuing without it.` | A versão anterior usava os padrões do projeto quando não havia `.env`; essa mensagem não era a falha de conexão |
| `npm warn deprecated` | Avisos de dependências; a instalação terminou no log |
| Relatório de vulnerabilidades do npm | É uma análise das dependências, separada do erro de conexão. Não use `npm audit fix --force` para tentar corrigir o MySQL; ele pode trocar versões do Expo e React |

A versão atual carrega `backend/.env` quando ele existe e explica os erros de conexão em português. O banco continua sendo MySQL.
