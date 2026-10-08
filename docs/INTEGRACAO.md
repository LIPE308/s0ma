# Integração do SOMA na base oficial

Este relatório registra a migração inicial, anterior ao redesign. As comparações de arquivos e capturas abaixo se referem àquele momento. A evolução visual aprovada posteriormente está documentada em [REDESIGN.md](REDESIGN.md).

## Origem e destino

- Fonte: `soma-pulso-windows.zip`, recebido em 08/10/2026.
- SHA-256 do ZIP: `182e4fafce465ac9c92d39754a1a234b899aeb1e8e02c1fb2415cf91d38305a0`.
- Destino: `LIPE308/s0ma`, branch `codex/integrate-soma`.
- Base: `profRodrigoSenac/projetoIntegrador2026`, commit `c4305af0575f0bb3768f902797a60031bce3c007`.
- O clone conserva o histórico do fork; `origin` aponta para a equipe e `upstream` para a base do professor. Nenhuma alteração é enviada ao professor.

## Análise antes da integração

Foram examinados o inventário do ZIP, todas as rotas, componentes, módulos de telas, serviços, backend, esquema SQL, testes, documentação e configurações. Os dez assets de imagem do ZIP são idênticos aos da base. A comparação da base com o fork mostrou a mesma árvore inicial e o mesmo commit.

As versões de Expo 54, React 19.1, React Native 0.81.5, Expo Router 6 e TypeScript 5.9 coincidem. O ZIP acrescenta apenas `mysql2` e suas dependências transitivas. Não há migração de framework nem biblioteca nova de interface.

| Área | Integração |
| --- | --- |
| `app/` | 35 telas, cinco abas, layouts e navegação do Igor preservados |
| `src/components/` | Logo, paleta, tipografia, estilos, formulários, modais e estados de conexão preservados |
| `src/screens/` | Conta, descoberta, contribuições, criação, gestão, finanças simuladas e administração preservadas |
| `src/servicos/` e `src/data/` | Contratos da API, sessão web e formatação preservados |
| `backend/` | Servidor Node, MySQL, esquema, dados iniciais, validação e testes preservados |
| `compose.yaml` e `docs/` | Configuração e instruções de execução do Igor preservadas |
| `assets/images/` | Dez arquivos originais da base preservados byte a byte |
| `.env.exemplo`, `eslint.config.js`, `tsconfig.json` | Arquivos originais do fork preservados |
| `.gitignore` | Regras originais mantidas, acrescentando exclusões locais do backend |
| `package.json` e lockfile | Scripts originais e versões mantidos; incorporados os quatro scripts do backend/build e `mysql2` |
| `examples/` | Exemplos de busca, produtos, componentes, serviços oficiais e README do professor preservados conforme o ZIP |

## Adaptações e preservação

As rotas demonstrativas de busca e produtos e os serviços/componentes de exemplo saem de `app/` para `examples/base/`, como já feito no ZIP. Isso evita telas extras e módulos de serviço tratados como páginas pelo Expo Router. O exemplo de uso importa os serviços por `@/examples/base/rotaServidor/produtos`. O componente demonstrativo recebido já remove a referência quebrada a `CardFilme`, ausente na base. Os arquivos antigos permanecem também no histórico Git.

O nome, slug e scheme do Expo passam a identificar o SOMA. A saída web muda de `static` para `single`, conforme o ZIP, permitindo o servidor Node entregar a aplicação e a sessão web funcionar nas rotas. Os plugins, configuração nativa e scripts de desenvolvimento da base são mantidos.

O frontend e backend do Igor são copiados sem redesenho ou refatoração. A documentação acrescenta a origem do fork e diferencia o backend local do servidor oficial. O ZIP original permanece intacto; `dist/`, dependências instaladas, configurações locais e arquivos de verificação não entram no commit.

## Compatibilidade com o servidor do professor

A base permite interfaces e regras próprias, mas documenta um backend central com `/produtos` e `/users`, autenticado por um token de equipe. O SOMA usa campanhas, necessidades, ajudas, sessões individuais e financeiro simulado. A integração conserva o backend do Igor para não perder esses comportamentos e conserva os serviços oficiais para referência. Não inventa um mapeamento incompatível nem substitui o servidor central. Se a entrega exigir exclusivamente a API central, será necessário alinhar esses endpoints com o professor antes de outra etapa.

## Validação

Validação executada em 08/10/2026, no Windows, com Node 25.6 e MySQL 8.4 pelo Docker:

| Verificação | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | 924 pacotes instalados a partir do lockfile; avisos de dependências antigas sem falha |
| `npx tsc --noEmit` | Passou, sem erros |
| `npm run lint` | Passou, sem erros ou avisos de lint |
| `npm run compilar:web` | Passou; bundle de produção e 37 assets exportados para `dist/` |
| `npm run banco:iniciar` | MySQL 8.4 iniciou e ficou saudável |
| `npm run testar:backend` | Oito testes passaram; nenhum falhou ou foi ignorado |
| Servidor local e `/api/saude` | Servidor iniciou e conectou ao MySQL |
| Navegador Edge, 35 telas | 70 verificações de abertura: 35 como visitante e 35 como administrador; sem rotas não encontradas ou erros de JavaScript |
| Formulários no navegador | Cadastro/sessão, criação nas quatro etapas, publicação, edição de perfil, persistência após recarregar e logout passaram |
| Contribuições no navegador | Login, reserva/cancelamento de objeto, criação/confirmação de pagamento simulado e navegação administrativa passaram |
| Fidelidade da interface | Capturas do login original do ZIP e integrado idênticas byte a byte nas larguras 390 e 1280 pixels |
| Fidelidade dos arquivos | 65 arquivos de `app/`, `src/`, `backend/` e `assets/` idênticos byte a byte ao ZIP |
| Revisão do diff | Sem erros no código. `git diff --check` sinalizou apenas dois espaços de quebra de linha Markdown no README original preservado; a verificação com `core.whitespace=-blank-at-eol` passou |

Os testes existentes abrangem validação, sessões, permissões, SQL parametrizado, criação/edição, rollback, reserva concorrente da última unidade, recebimento parcial, cancelamento, ações, publicações, avisos, limites financeiros simulados, repasse, reembolso, moderação e persistência após reiniciar o Node.

A verificação no navegador usou o banco separado `soma_ui_validacao`, removido após os testes. Os testes do backend usam seus próprios bancos temporários. Os scripts, resultados e capturas de validação permanecem fora do fork e não entram no commit. O banco normal do aplicativo é preservado.

## Pendências e limites

Não foram encontrados erros críticos nas verificações executadas. A instalação apresenta avisos de dependências depreciadas herdadas; não foram feitas atualizações de framework nesta migração. Android/iOS e execução em aparelho físico não foram testados, pois este ambiente de validação usou apenas o navegador no Windows.

A identidade das capturas demonstra fidelidade do login em duas larguras; não representa uma comparação visual individual de todas as 35 telas. Os demais arquivos da interface permanecem idênticos ao ZIP e suas rotas foram verificadas no navegador.

Não foi validada uma sessão na API central do professor: não foi fornecido um token real de equipe, e o SOMA recebido não utiliza esse contrato. O alinhamento de uma eventual exigência de backend exclusivamente central permanece pendente, sem alterar a implementação do Igor.

Para identificar o commit de integração sem registrar um hash autorreferente neste arquivo, execute `git log --format="%H %s" --grep="feat: integrate updated SOMA application into official project base" -1`.
