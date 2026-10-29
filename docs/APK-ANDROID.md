# APK Android para o grupo

APK 1.0.1 (versionCode 2) concluído no Expo em 29/10/2026, perfil grupo.

[Instalação e download no Expo](https://expo.dev/accounts/studio308/projects/soma-pulso/builds/888bbcf6-69d3-4381-805f-f1c3f962e028).

A API usada pelo APK é https://soma-api-studio308.onrender.com/api e está conectada ao Supabase do Igor, projeto yahvoqitjxgrlndtaciu. O computador local pode ficar desligado. O plano gratuito do Render pode levar cerca de um minuto para acordar depois de inatividade.

Para testar: baixar e instalar o APK em Android, criar conta ou entrar com e-mail e senha. A chave de assinatura foi preservada para permitir atualização da versão anterior. Login Google nativo ainda não está configurado. Pagamentos e receita publicitária permanecem simulados.

O arquivo foi conferido: manifesto do pacote com.soma.pulso, bloco de assinatura presente, URL HTTPS correta no bundle e ausência das credenciais locais. O QR code direto foi decodificado e conferido. O teste HTTP público confirmou cadastro, login e gravação/leitura de rascunho no Supabase; registros temporários foram removidos. A instalação física no celular será feita pelo grupo.

SHA-256: 928196ddd758253ad24b3e8fcab2c7d8e14c0a2c38cf5d7b96dd38a76f9f1104

Os artefatos deste build têm expiração informada pelo Expo para 12/11/2026. Depois disso é necessário gerar nova compilação.

## Gerar outra versão

Configurar EXPO_PUBLIC_URL_BACKEND no perfil grupo de eas.json e executar npm run apk:grupo com a mesma variável no ambiente local. O comando verifica a saúde da API e a conexão PostgreSQL antes de iniciar o EAS. Incrementar android.versionCode para uma nova atualização e preservar o projeto/keystore Expo.

O perfil preview antigo aponta para o IP da rede local e só serve para testes com PC ligado na mesma rede. Para compartilhar com o grupo, usar o perfil grupo.

.easignore exclui o backend, os arquivos privados e experimentos locais; nenhuma senha do banco faz parte do APK.
