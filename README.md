# SOMA

**SOMA 2.0:** Rota Inteligente, urgência com revisão humana, fundo de anúncios simulado, Mapa Solidário por consentimento e perfis personalizados. Veja [funcionalidades, regras e configuração Google](docs/SOMA-2.md) e o [plano de implementação](docs/SOMA-2-PLANO.md). Novas campanhas ficam em rascunho e só são públicas depois de enviadas e aprovadas; campanhas anteriores foram preservadas.

Identidade **Enlace + azul royal**, com fotografia editorial, histórias de campanhas e superfícies acolhedoras. Os temas **Claro, Escuro e Sistema** podem ser escolhidos no perfil e ficam salvos no dispositivo. O aplicativo mantém as rotas anteriores e acrescenta 10 rotas do SOMA 2.0, transições suaves e redução de movimento. Consulte a [direção visual](docs/REDESIGN.md) e a [repaginação JF](docs/REPAGINACAO-JF.md).

Projeto acadêmico com front React Native/Expo e backend em **Node.js puro + MySQL**. Os nomes das variáveis, funções da API, tabelas e mensagens estão em português. O servidor usa `http`, funções e comandos SQL, sem Express ou ORM. O backend usa `mysql2` para MySQL e a biblioteca oficial `google-auth-library` para OAuth opcional.

Este projeto foi integrado ao [fork da equipe](https://github.com/LIPE308/s0ma), derivado da [base do professor Rodrigo](https://github.com/profRodrigoSenac/projetoIntegrador2026). Os exemplos e serviços originais estão em `examples/`, fora das rotas ativas. Consulte o [relatório da integração](docs/INTEGRACAO.md).

O SOMA recebido usa o backend local de campanhas em `backend/` e `src/servicos/api.ts`. Os serviços de produtos e usuários da API oficial permanecem em `examples/base/rotaServidor/`, junto com `.env.exemplo`, para referência. Essas APIs possuem contratos diferentes; o token da API oficial não substitui uma sessão do SOMA. Migrar os dados e fluxos para o servidor central do professor depende de endpoints compatíveis e não foi realizado nesta integração.

## Executar na web

**No Windows x64, o projeto pode iniciar seu próprio MySQL, sem Docker ou instalação de serviço:**

```bash
npm ci
npm run banco:local
npm run compilar:web
npm run servidor
```

O primeiro comando do banco baixa o MySQL oficial, verifica o SHA-256 e cria `soma` na porta **3307**. Gera senhas aleatórias e configura `backend/.env`. Os dados ficam em `backend/.mysql/dados`; essa pasta e as credenciais são ignoradas pelo Git. Reiniciar preserva os registros. Use `npm run banco:local:estado` para conferir e `npm run banco:local:parar` para encerrar. Após reiniciar o computador, execute `npm run banco:local` e `npm run servidor` novamente. Um `.env` de outro banco é preservado; consulte o [guia do Windows](docs/WINDOWS.md).

**Com Docker**, tenha Node.js 24.19 ou superior e Docker com Compose instalado e aberto. Execute na pasta do projeto:

```bash
npm ci
npm run banco:iniciar
npm run compilar:web
npm run servidor
```

Espere a mensagem **MySQL conectado** e abra `http://localhost:3001` no navegador **do computador onde executou os comandos**. O Node entrega o site e a API no mesmo endereço. A primeira compilação pode demorar. Não é necessário abrir outro servidor Expo para apresentar o projeto.

O MySQL fica na porta 3306. O Compose cria o banco `soma`, o usuário `soma` e a senha local de exemplo `soma_local_123`. Na primeira inicialização, a API cria as tabelas e alguns dados para testar. Os dados ficam no volume `dados_mysql`; reiniciar não apaga os cadastros.

Se a API iniciar antes do MySQL estar pronto, espere o banco terminar de iniciar e execute novamente `npm run servidor`. Se já usa MySQL no computador, veja a [configuração sem Docker](docs/BACKEND.md#usar-mysql-já-instalado).

## Contas e administração da demonstração

Cadastre sua própria conta pela tela. Em um banco vazio, as campanhas ilustrativas são criadas com responsáveis de exemplo e senhas aleatórias não divulgadas; elas não são contas de acesso compartilhado. Cadastros e senhas de bancos já existentes são preservados.

Para autorizar uma conta administrativa, primeiro cadastre-a normalmente. No computador que administra o banco, execute com o e-mail dessa conta:

```bash
npm run admin:configurar -- seu-email@example.org
```

O comando usa a configuração privada de `backend/.env`, promove somente a conta informada e encerra suas sessões anteriores. Faça login novamente: o aplicativo abre a área administrativa. Não existe promoção pelo cadastro público nem senha administrativa padrão. Quem tem acesso ao terminal e ao banco é um operador de confiança.

**Compatibilidade de segurança:** a antiga conta publicada `admin@exemplo.com` perde apenas a permissão administrativa ao iniciar esta versão. Sua conta, senha, acesso comum e histórico permanecem. A mudança é necessária porque suas credenciais privilegiadas eram públicas. Configure uma conta própria com o comando acima; esse endereço histórico é reservado e não pode ser promovido pelo comando. Outros administradores são preservados.

## Funcionalidades

- Cadastro, login, perfil e encerramento de sessão.
- Criar, consultar, editar e encerrar campanhas com necessidades independentes. Novas publicações, edições e reaberturas passam por revisão; reabrir também exige motivo e atualização de meta.
- Registrar intenção, combinar a entrega por telefone/WhatsApp e confirmar o total realmente recebido, inclusive parcial. Reservas não contam como recebimento; duas reservas não ocupam a última unidade ao mesmo tempo. O contato e as orientações privadas aparecem na ajuda autorizada.
- Publicar atualizações, consultar atividade, receber avisos e registrar denúncias.
- Administração com permissões verificadas na API.
- Contribuições financeiras **simuladas**, sem novas taxas: o valor integral confirmado conta para a meta. Registros e operações financeiras anteriores são preservados. Nenhum Pix, cobrança, transferência ou reembolso real é executado.

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

Se escolheu o MySQL próprio no Windows, use **`npm run testar:backend:local`**. Esse comando lê as credenciais locais sem exibi-las e executa a mesma suíte em um banco temporário.

Os testes de backend precisam do MySQL ligado. Criam e removem um banco separado chamado `soma_teste_...`; não alteram o banco `soma`. Verificam cadastro, permissões, migração do esquema anterior, reservas concorrentes, confirmação parcial, financeiro simulado, moderação, privacidade, reabertura e persistência após reiniciar o Node.

Ao iniciar, a API aplica automaticamente as atualizações aditivas do esquema original e do SOMA 2.0, incluindo lançamentos, urgências e arquivos privados. Não é necessário recriar o banco nem apagar dados. Veja o [guia SOMA 2.0](docs/SOMA-2.md). O [relatório da versão anterior](docs/AUDITORIA-ENTREGA.md), o [roteiro de demonstração](docs/DEMONSTRACAO.md) e as [respostas sobre confiança e limites](docs/LIMITES-DO-PRODUTO.md) preservam o histórico; as mudanças de publicação e a nova Rota estão descritas no guia atual.
