# SOMA no Supabase

O servidor Node continua responsável pelas contas, sessões, permissões e regras de negócio. O PostgreSQL do Supabase substitui o MySQL quando `BANCO_TIPO=postgres` ou `DATABASE_URL` estiver configurada. O aplicativo continua usando `EXPO_PUBLIC_URL_BACKEND`.

## Instalar em um projeto novo

A instalação inicial e os 36 índices de chaves estrangeiras já foram aplicados no projeto `yahvoqitjxgrlndtaciu`, da organização `soma`, em 29/10/2026. Foram verificadas 33 tabelas com RLS e nenhuma conta de exemplo. A conexão e os fluxos HTTP do servidor ainda dependem de `DATABASE_URL` local.

1. Crie um projeto SOMA na organização desejada do Supabase.
2. No SQL Editor desse projeto **novo e vazio**, execute `backend/esquema-postgres.sql`, depois `backend/indices-postgres.sql` e `backend/migracao-admin-postgres.sql`. Eles criam as tabelas e índices sem contas nem campanhas de demonstração. Não são importadores de dados MySQL. Não execute sobre uma instalação anterior com dados sem preparar uma migração específica.
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

## Compatibilidade com o painel atual

Para o projeto já instalado pelo Igor, aplique somente backend/migracao-admin-postgres.sql depois de conferir o esquema existente. Ela adiciona bloqueio, destino dos avisos, tabelas de e-mails/relatórios e verificador OAuth de 128 caracteres, sem apagar contas ou campanhas. As novas tabelas também têm RLS e acesso direto revogado. A inicialização exige o marcador 006-administracao-supabase para impedir que uma API parcialmente atualizada seja colocada no ar.

O teste PostgreSQL agora inclui as consultas dinâmicas do painel e falha/reenvio da fila de e-mails. Isso é validação local: a conexão real ainda depende das credenciais privadas do servidor.

## API pública e APK do grupo

render.yaml prepara um serviço Node gratuito de demonstração. Configure DATABASE_URL somente nos segredos do servidor e APP_URL com a URL HTTPS atribuída. Se necessário, adicione o certificado raiz como arquivo secreto e PGSSLROOTCERT com o caminho desse arquivo. Não substitua a validação TLS por rejectUnauthorized=false. O plano gratuito pode dormir quando ocioso e bloqueia SMTP nas portas 465/587; os avisos internos continuam disponíveis e o envio externo precisa de um provedor HTTP ou hospedagem compatível.

Depois da API publicada, configure EXPO_PUBLIC_URL_BACKEND no ambiente EAS usado pelo perfil grupo, com a URL HTTPS da API seguida de /api. Execute npm run apk:grupo com a mesma variável local. O comando verifica /saude e exige Supabase/PostgreSQL antes de iniciar a compilação. A versão Android preparada é 1.0.1, versionCode 2. Não foi gerado APK nem QR code atualizado enquanto a API pública não estiver confirmada.
