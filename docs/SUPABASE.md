# SOMA no Supabase

O servidor Node continua responsável pelas contas, sessões, permissões e regras de negócio. O PostgreSQL do Supabase substitui o MySQL quando `BANCO_TIPO=postgres` ou `DATABASE_URL` estiver configurada. O aplicativo continua usando `EXPO_PUBLIC_URL_BACKEND`.

## Instalar em um projeto novo

1. Crie um projeto SOMA na organização desejada do Supabase.
2. No SQL Editor desse projeto **novo e vazio**, execute `backend/esquema-postgres.sql`. Ele cria as tabelas sem contas nem campanhas de demonstração. Não é um importador de dados MySQL. Não execute sobre uma instalação anterior com dados sem preparar uma migração específica.
3. Em Connect, copie a conexão PostgreSQL **Session pooler** (porta 5432) para `DATABASE_URL` em `backend/.env`. Use a senha do banco, com caracteres especiais codificados na URL. Essa informação é secreta e deve ficar somente no servidor.
4. Baixe o certificado raiz em Database Settings e configure `PGSSLROOTCERT` com seu caminho se necessário. A conexão remota valida o certificado e o nome do servidor; não desative essa validação.
5. Execute `npm ci` e `npm run servidor`. O log deve indicar `Supabase/PostgreSQL conectado`.
6. Crie sua conta no aplicativo. Para conceder administração, use `npm run admin:configurar`, conforme as instruções desse comando.

```dotenv
BANCO_TIPO=postgres
DATABASE_URL=postgresql://postgres.REFERENCIA:SENHA_CODIFICADA@HOST_DO_SESSION_POOLER:5432/postgres
PGSSLROOTCERT=C:/certificados/prod-ca.crt
```

O esquema habilita RLS e retira acesso das funções `anon` e `authenticated` em todas as tabelas da aplicação. Não há políticas de acesso direto: as sessões atuais pertencem ao servidor SOMA, não ao Supabase Auth. A conexão PostgreSQL do servidor precisa de uma função autorizada a acessar as tabelas. Nunca envie a senha do banco ou uma chave privilegiada ao Expo.

Para deixar também a API disponível fora do computador, hospede o servidor Node e configure a URL pública no aplicativo. Colocar o banco no Supabase não hospeda automaticamente a API nem o frontend. Use HTTPS e `COOKIE_SEGURO=1` na hospedagem.

## Verificação

`npm run testar:postgres` valida o esquema em PostgreSQL embarcado, reaplicação, consultas estáticas da API, upserts, restrições, rollback e bloqueio de leitura pelo papel `anon`. Não usa nem modifica o projeto remoto. Os testes antigos `testar:backend` continuam exigindo MySQL; não devem apontar para o Supabase.

A instalação só está concluída após testar cadastro, login, publicação e leitura no projeto remoto configurado. As credenciais e o certificado não são versionados.

## Voltar ao MySQL local

Remova `DATABASE_URL` e `BANCO_TIPO=postgres` de `backend/.env`. Os scripts e esquemas MySQL continuam disponíveis para desenvolvimento e regressão. Isso não copia dados entre os bancos.

Referência: [conexões PostgreSQL no Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
