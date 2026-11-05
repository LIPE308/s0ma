# Atualizações OTA do SOMA

## Integração na main com MySQL local

O código OTA foi integrado à `main` junto com a escolha de MySQL como banco padrão. A seleção de PostgreSQL ficou somente como compatibilidade explícita (`BANCO_TIPO=postgres`); a presença de uma `DATABASE_URL` antiga não altera o MySQL.

As URLs de API legadas foram retiradas de `eas.json`. Os campos `EXPO_PUBLIC_URL_BACKEND` estão vazios intencionalmente: configure a API Node que atende ao MySQL antes de gerar APK ou publicar OTA. Para `local`, use o IP da máquina acessível pelo telefone na mesma rede. Para os demais perfis, use HTTPS público. O aplicativo nunca deve receber a senha do MySQL nem se conectar diretamente à porta 3307.

Os comandos assistidos de OTA recusam publicar enquanto essa configuração estiver vazia. Quando houver uma API adequada, alinhe o campo do perfil **e** a variável `EXPO_PUBLIC_URL_BACKEND` do ambiente EAS correspondente antes de publicar; as variáveis EAS antigas não foram alteradas por este merge. O comando `apk:grupo` agora exige que a saúde da API confirme `MySQL`.

O relatório `OTA-VALIDACAO.json` e o APK de preview nele referenciado são registros da homologação anterior à escolha de MySQL. Essa build usa a API remota antiga e não representa a configuração local atual. O teste no aparelho continua pendente. A alteração dos perfis modifica o fingerprint: calcule o novo runtime e gere uma nova base de teste após configurar a API. Incremente o versionCode antes de distribuir a próxima build. Nenhum update de produção foi publicado por esta integração.

## Situação e migração inicial

### Nova tela de acesso com vídeo

O redesign de login e cadastro adicionou `expo-video` 3.0.16 e seu plugin, compatíveis com SDK 54. Essa dependência altera o código nativo e o fingerprint: os APKs anteriores não podem receber o player pelo runtime antigo. Configure a API, incremente o versionCode e gere/homologue uma nova build antes de distribuir. Não foi publicada OTA nem gerado APK por essa mudança visual. A sequência local de três vídeos possui transições suaves, imagem de reserva e respeito à preferência de movimento reduzido, sem controles de reprodução; fonte e adaptação estão em `assets/videos/CREDITOS.md`.

Implementação em 05/11/2026 para Expo SDK 54, React Native 0.81.5 e `expo-updates` 29.0.20. Projeto EAS: `@studio308/soma-pulso`, ID `90068c5e-1b11-40f7-b9ee-2b0bb8d6061d`.

O APK 1.0.1/versionCode 2 distribuído anteriormente foi criado sem `expo-updates`, URL de update, canal ou runtime. Ele **não pode ganhar OTA por OTA**. É necessário instalar uma nova build uma única vez, mantendo pacote `com.soma.pulso` e o keystore existente. A nova base é 1.1.0/versionCode 3.

Nenhuma atualização OTA de produção está autorizada nesta tarefa. Commit/push de código no GitHub não publica EAS Update. Não há workflow que publique automaticamente.

## Canais e builds

| Perfil EAS | Canal OTA | Ambiente EAS | Uso |
| --- | --- | --- | --- |
| `development` | `development` | `development` | APK release interno para desenvolvimento/testes OTA |
| `preview` | `preview` | `preview` | Homologação em APK release, antes de produção |
| `grupo` | `production` | `production` | APK definitivo do grupo, somente depois da homologação |
| `production` | `production` | `production` | AAB para Play Store |
| `local` | `development` | `development` | Antigo teste por IP local; permite HTTP e tem runtime diferente |

`development` é um APK autônomo de teste, não um development client que depende do Metro. `npm start` continua disponível para Expo Go; Expo Go/debug e web não executam o controlador OTA. A configuração local antiga saiu de `preview` para `local` para que a homologação use a mesma configuração HTTPS da versão definitiva.

Os canais estão ligados a branches EAS de mesmo nome. Não apontar preview/development para a branch de produção, nem alterar canais em tempo de execução. O aplicativo não expõe override de URL, runtime ou cabeçalhos do updater.

A API pública está em `EXPO_PUBLIC_URL_BACKEND` nos três ambientes EAS. As variáveis `env` dos perfis de build **não são automaticamente aplicadas por `eas update`**; sempre informar `--environment`. Nunca incluir senha de banco, OAuth secret, credencial SMTP ou token de pagamento em `EXPO_PUBLIC_*`.

## Compatibilidade nativa

`runtimeVersion: { "policy": "fingerprint" }` deriva um hash da configuração e dependências nativas. A instalação só aceita updates de plataforma e runtime correspondentes. Não usar runtime fixo/manual, `--skip-bundler`, desativar proteções ou forçar um runtime antigo para entregar código incompatível.

`.fingerprintignore` exclui backend, arquivos temporários, documentação e os mesmos experimentos locais de áudio excluídos por `.easignore`. Não exclui dependências nativas, plugins, app config, ícones ou configuração de build. O hash é conservador: algumas mudanças de configuração/scripts também podem exigir nova build mesmo sem uma alteração nativa intencional. Comparar o runtime do update com o da build, não somente o número de versão.

Para consultar o runtime local:

```powershell
$env:EXPO_PUBLIC_URL_BACKEND='https://soma-api-studio308.onrender.com/api'
npx expo-updates runtimeversion:resolve --platform android
```

Mudanças futuras que exigem APK/AAB novo: instalar/atualizar módulos nativos, mudar Expo SDK ou React Native, permissões, plugins de configuração, ícone/splash nativos, package/scheme, configurações Android/iOS ou do próprio updater. A mudança do canal embutido também exige nova build. JS, estilos, textos, imagens carregadas pelo JS e regras de interface podem ser OTA quando o fingerprint permanece compatível. OTA do cliente não atualiza a API Node, o banco, credenciais ou serviços externos.

## Quando o update é aplicado

Após a interface e sessão inicial estarem prontas, o app consulta uma vez por processo JS, sem esperar a rede para renderizar. Havendo atualização compatível, baixa o conteúdo sem bloquear a interface e sem chamar `reloadAsync`. Troca de tema, remontagem e retorno do app do background não repetem a consulta nem aplicam o update.

O bundle baixado fica disponível para a próxima inicialização completa pelo carregador nativo. Apenas minimizar e voltar não é uma inicialização completa. Não fechar o app enquanto envia um formulário só para atualizar; terminar a operação primeiro. Os formulários continuam com seu comportamento atual; OTA não adiciona persistência de rascunhos nem promete recuperar um formulário que o usuário fechou por conta própria.

O download é assíncrono enquanto o processo está ativo; não há garantia de que o Android/iOS continue executando-o depois de suspender/encerrar o app. Se a rede falhar, mantém o conteúdo funcional e tenta na próxima abertura.

Configuração nativa: `ON_ERROR_RECOVERY`, timeout de cache zero, bundle embarcado preservado e anti-bricking habilitado. O carregador nativo valida a compatibilidade; download parcial não é aplicado. O Expo possui recuperação de falhas precoces, mas não garante recuperação de todo crash. Em erro fatal pode ocorrer reinício/crash como parte dessa recuperação; a promessa de não interromper refere-se ao fluxo normal de atualização.

## Diagnóstico e privacidade

Em **Configurações > Atualizações do app** (`/atualizacoes-app`), conferir:

- versão de conteúdo, canal, runtime, update ID e origem APK/OTA;
- indicação de recuperação emergencial;
- últimos eventos, incluindo `falha_verificacao`, `falha_download` e `pronta_na_proxima_abertura`;
- códigos nativos de recuperação das últimas 24 horas.

Eventos do SOMA ficam em um buffer local de até 40 registros em AsyncStorage e no console `[SOMA OTA]`. Não enviam telemetria nem incluem conta, sessão, formulários, mensagens de erro brutas ou dados de doações. O console nativo completo pode ser consultado pelo desenvolvedor via ADB quando necessário; não compartilhar logs integrais sem revisar dados privados. A rota existente `/atualizacoes` das campanhas permanece preservada.

## Homologação obrigatória

1. Rodar `npm run testar:ota`, verificar tipos/lint e exportar Android.
2. Salvar mudanças em commit. Gerar uma base: `npx eas-cli build --platform android --profile preview`.
3. Instalar esse APK no celular, conferir a versão de conteúdo `ota-base-1` e anotar runtime/canal. O runtime tem que corresponder ao da atualização.
4. Alterar somente `src/servicos/versao-ota.ts` para `ota-teste-1`, salvar em commit e publicar **apenas preview**: `npm run ota:preview -- "Homologacao OTA teste 1"`.
5. Abrir o app conectado, conferir evento `pronta_na_proxima_abertura`. A versão da sessão atual deve continuar `ota-base-1`. Manter um formulário aberto e retornar do background: ele não deve ser interrompido pelo updater.
6. Concluir/cancelar o formulário, fechar totalmente o processo e abrir novamente. Conferir `ota-teste-1`, origem OTA e update ID correspondente, sem reinstalar o APK.
7. Conferir login/sessão, leitura das campanhas e navegação. Não criar doações/campanhas reais só para testar OTA. Reabrir offline para verificar uso do bundle já armazenado; funcionamento de telas que dependem da API ainda exige rede.
8. Registrar modelo/Android, build ID, update ID, runtime e resultado. Validar rollback em preview antes de usá-lo em produção. Testes unitários, exportação, build concluída e update disponível no servidor não substituem esse teste no aparelho.

Publicar o candidato de teste depois da conclusão da base nativa. Um update publicado antes da geração do bundle embarcado pode ser considerado antigo pela seleção nativa mesmo com runtime correto; nesse caso, republicar o mesmo grupo explicitamente para `preview` depois de concluir a build. A data e a política de seleção nativa também participam da escolha do bundle.

`npm run ota:development -- "descricao"` oferece o mesmo fluxo no canal development. Os comandos assistidos recusam produção, exigem commit e aceitam somente uma mensagem, sem opções adicionais. O comando EAS pode ser usado diretamente por quem possui credenciais; os scripts são uma proteção operacional, não substituem controle de acesso à conta Expo.

## Publicação futura em produção — somente com autorização

Depois da validação em aparelho e autorização explícita do responsável, criar/distribuir a nova base definitiva `grupo` com OTA. Quem instalar o APK preview continuará no canal preview; não há promoção remota de uma instalação de teste para produção.

Publicar o mesmo código validado, com runtime correspondente, iniciando com rollout pequeno:

```powershell
# NÃO executar sem autorização e validação registradas.
npx eas-cli update --channel production --environment production --platform android --message "Descricao da versao validada" --rollout-percentage 10
```

Revisar grupo, runtime, fingerprint, ambiente e canal no painel Expo antes de ampliar o rollout. Registrar update ID, commit e resultado da homologação. Não adicionar `--auto`, `--force-end-active-rollout` ou automação de publicação ao push. Novas versões da API precisam continuar compatíveis com APKs antigos ainda em uso.

## Recuperação operacional

Se houver falha, interromper a expansão do rollout e revisar os logs. Preferir uma correção para frente no mesmo runtime. Para republicar uma versão anterior conhecida ou emitir rollback ao bundle embarcado, usar as ações de rollback do painel Expo ou consultar `npx eas-cli update:republish --help` / `npx eas-cli update:roll-back-to-embedded --help` para selecionar explicitamente canal e runtime. Testar primeiro em preview; produção também requer autorização. Não apagar dados/AsyncStorage nem desinstalar para contornar falhas: isso pode perder dados do usuário.

Rollback não desfaz migrações locais ou mudanças no servidor. Se houve mudança de estado incompatível com a versão anterior, corrigir para frente. O bundle embarcado permanece disponível, mas a recuperação automática não é substituto de homologação.

## Fontes oficiais

- [expo-updates](https://docs.expo.dev/versions/latest/sdk/updates/) — a implementação também foi conferida nos tipos da versão instalada 29.0.20.
- [Runtimes e compatibilidade](https://docs.expo.dev/eas-update/runtime-versions/)
- [Processo de publicação](https://docs.expo.dev/eas-update/deployment/)
- [Download e inicialização](https://docs.expo.dev/eas-update/download-updates/)
- [Limites da recuperação](https://docs.expo.dev/eas-update/error-recovery/)
