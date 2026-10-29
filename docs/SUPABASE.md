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

## Testar no celular com Expo Go

No computador configurado com o Supabase, inicie `npm run servidor:rede-local` e, em outro terminal, `npx expo start --lan --clear`. Conecte celular e computador à mesma rede Wi-Fi confiável e abra o QR code no Expo Go. O app de desenvolvimento tenta usar o endereço local do computador informado pelo Expo. A porta 3001 deve estar acessível na rede; firewall, rede de convidados ou isolamento de clientes podem bloqueá-la. Um túnel do Expo disponibiliza o JavaScript, mas não cria um túnel para a API.

Este teste usa HTTP na rede local: use apenas contas e senhas de teste e não o execute em redes públicas. O servidor fica acessível a outros dispositivos na rede enquanto o comando estiver aberto; encerre-o ao terminar.

Um APK independente precisa de um servidor HTTPS acessível e de `EXPO_PUBLIC_URL_BACKEND=https://endereco-da-api/api` configurado antes de gerar o APK. Variáveis Expo públicas ficam dentro do aplicativo: não coloque senhas nem chaves secretas nelas. Alterar o código ou a variável depois de gerar um APK não corrige o APK já instalado. Se o dispositivo estiver usando 4G/5G ou outra rede, o endereço local do computador não funcionará.

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

## Conexão remota validada em 29/10/2026

O servidor local foi configurado para o projeto yahvoqitjxgrlndtaciu via Session pooler, com verificação TLS e certificado raiz oficial. O endpoint /api/saude confirmou Supabase/PostgreSQL. Uma transação inseriu e leu usuário/campanha temporários e confirmou rollback sem resíduos; GET /api/campanhas retornou HTTP 200. As 2 contas e 8 campanhas previamente existentes foram preservadas.

O utilitário backend/configurar-supabase-local.js usa backend/.env.supabase.local (ignorado pelo Git), verifica o projeto esperado, aplica a atualização aditiva e só então altera backend/.env. O certificado público está em backend/certs/prod-ca-2021.crt. As senhas não são distribuídas. Esses passos não importam automaticamente o histórico do MySQL local.

A API pública ainda precisa ser publicada antes da compilação do APK do grupo. Render exige login/autorização do proprietário e DATABASE_URL configurada como segredo de servidor.

## API pública de demonstração

Publicada e verificada em https://soma-api-studio308.onrender.com/api/saude, retornando Supabase/PostgreSQL no projeto do Igor. Serviço Render soma-api-studio308, plano Free, segredos somente no servidor. O perfil EAS grupo usa https://soma-api-studio308.onrender.com/api. No plano gratuito, a primeira abertura após inatividade pode levar cerca de um minuto; a aplicação utiliza valores financeiros simulados. Login de teste disponível por e-mail e senha.
