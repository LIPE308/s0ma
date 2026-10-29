# APK de teste Android

Perfil preparado: `npx eas-cli build --platform android --profile preview`.
Antes, executar `npx eas-cli login` e vincular o projeto à conta Expo.
O EAS fornece o link para baixar o APK após compilar. Não há APK gerado ainda.

O perfil preview aponta para http://10.10.84.209:3001/api. Celular e PC precisam estar na mesma rede e permitir comunicação entre dispositivos. Se o IP do PC mudar, atualizar eas.json e gerar novamente. Este endereço não funciona fora dessa rede.

Iniciar MySQL com `npm run banco:local`. Para disponibilizar o backend na rede, iniciar no PowerShell com `$env:ENDERECO='0.0.0.0'; npm run servidor`. A porta 3001 precisa estar acessível na rede privada; não expor a porta do MySQL.

O APK contém apenas o cliente. .easignore exclui backend e arquivos de credenciais. O perfil de produção exige URL HTTPS de backend publicado antes de distribuir. HTTP é permitido somente no perfil preview.

Login Google atual está configurado para web em localhost; no APK utilizar login com e-mail e senha até configurar OAuth nativo.
