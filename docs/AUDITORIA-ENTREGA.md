# Auditoria e entrega — 20/10/2026

Revisão sobre a base `11846c0`, mantendo React Native/Expo Router, Node HTTP e MySQL. Nenhuma dependência foi acrescentada. O objetivo foi corrigir falhas concretas e completar os fluxos existentes.

## Achados confirmados e corrigidos

### 1. Administrador com credenciais publicadas — alta

- **Location:** `backend/banco.js:44` (inicialização); `backend/configurar-admin.js:9`; antigo cartão de acesso em `src/screens/account.tsx` e README da base.
- **Issue:** a inicialização criava uma conta privilegiada com senha compartilhada divulgada no próprio projeto.
- **Exploit Path:** visitante com acesso ao repositório → login da conta histórica → token com administração → moderação e operações administrativas.
- **Impact:** acesso administrativo indevido em instalações que mantinham a conta padrão.
- **Remediation:** nenhum administrador padrão em bancos novos; senhas dos responsáveis ilustrativos são aleatórias. Promoção exige comando local e conta já cadastrada. A conta histórica publicada perde somente o papel administrativo; conta, senha e histórico são preservados. Outros administradores permanecem. O comando invalida apenas sessões da conta promovida, exigindo novo login.
- **Test:** cadastro não aceita elevação, conta padrão não entra em banco novo, CLI real promove conta, sessão anterior é revogada; reinício remove o papel histórico sem apagar conta ou trocar sua senha.
- **PoC Requirements:** cópia local descartável e senha histórica fornecida por variável de ambiente; [poc_admin_padrao.py](auditoria/poc_admin_padrao.py).

### 2. Encerramento contornava suspensão — média

- **Location:** `backend/servidor.js:230`; restauração administrativa em `backend/servidor.js:411`.
- **Issue:** o responsável podia transformar uma campanha suspensa em encerrada; encerrada é um estado público.
- **Exploit Path:** responsável de campanha suspensa → PATCH de encerramento → retorno da campanha à consulta pública.
- **Impact:** anulação prática da ocultação administrativa. Não permitia moderar campanhas alheias.
- **Remediation:** encerramento só aceita ativa/encerrada. Moderação guarda o estado público anterior e o restaura, preservando encerramento. Reabertura exige motivo e meta atualizada em operação separada.
- **Test:** responsável recebe 409 ao encerrar campanha suspensa; detalhes/pedidos/atualizações ficam 404 para visitante; restaurar campanha antes encerrada não a reabre; histórico permanece.
- **PoC Requirements:** token do responsável e identificador de campanha suspensa descartável; [poc_moderacao_encerramento.py](auditoria/poc_moderacao_encerramento.py).

### 3. Instruções privadas nas respostas públicas — média

- **Location:** `backend/servidor.js:50` e `:54`, aplicados às listagens e detalhes de campanhas/necessidades.
- **Issue:** consultas públicas devolviam instruções de entrega, que podiam conter endereço/arranjo privado; também incluíam a justificativa interna da campanha.
- **Exploit Path:** visitante sem sessão → GET de campanha/necessidade/lista → leitura desses campos no JSON.
- **Impact:** divulgação desnecessária de informações de coordenação. Não foi constatada exposição pública de senha, resumo de senha ou identidade de denunciantes.
- **Remediation:** projeção pública esvazia instruções e justificativa; responsável/admin mantêm acesso. Doador recebe contato do responsável e orientações apenas em sua ajuda autorizada, depois de registrar a intenção.
- **Test:** marcador privado ausente nos quatro caminhos públicos (listas e detalhes), presente para dono e na ajuda do doador; terceiro recebe 403 ao tentar ler ajuda. Na interface, o marcador apareceu só depois da intenção.
- **PoC Requirements:** campanha pública de teste com instrução privada previamente conhecida; [poc_instrucoes_publicas.py](auditoria/poc_instrucoes_publicas.py).

### 4. Regras de vínculo/autoria da contribuição incompletas — baixa

- **Location:** `backend/servidor.js:258` e `:318`.
- **Issue:** campanha informada não era confrontada com a necessidade; doação financeira própria tinha bloqueio visual, mas faltava a regra equivalente na API.
- **Exploit Path:** usuário autenticado altera campanha_id/necessidade_id ou chama POST /pagamentos para sua própria campanha.
- **Impact:** contribuição poderia ser registrada em campanha diferente da indicada; responsável podia aumentar sua própria simulação. A necessidade era a fonte do vínculo SQL, portanto não havia escrita arbitrária em campanha alheia nem dinheiro real.
- **Remediation:** confrontar identificadores quando fornecidos e recusar contribuição financeira própria, seguindo a regra já usada para objetos/tarefas.
- **Test:** campanha incompatível recebe 400 em ajuda/pagamento, contribuição financeira própria 403; caminhos válidos permanecem funcionais.
- **PoC Requirements:** token de doador e duas campanhas descartáveis distintas; [poc_contribuicao_inconsistente.py](auditoria/poc_contribuicao_inconsistente.py). O script verifica o vínculo de objeto; a suíte verifica também autoria financeira.

Os quatro scripts são independentes, usam biblioteca padrão Python e **não enviam requisições por padrão**. Sintaxe e execução em dry run foram verificadas. Para ver o roteiro, execute `python docs/auditoria/poc_instrucoes_publicas.py`. O modo `--execute` exige parâmetros de teste e só aceita HTTP de loopback. As variantes ao vivo desses scripts não foram executadas contra o banco de apresentação. As regressões equivalentes foram executadas pela suíte Node em banco descartável; esta revisão combina evidência do código anterior com verificação das correções, sem afirmar exploração em produção.

## Funcionalidade e arquivos afetados

| Arquivos | Alteração |
| --- | --- |
| `backend/servidor.js` | Privacidade, identificação da campanha, validação de datas reais, simulação sem novas taxas, reabertura, deduplicação de relatos e restauração da moderação |
| `backend/operacoes.js` | Idempotência transacional para salvar campanha, registrar ajuda e criar pagamento |
| `backend/banco.js`, `backend/esquema.sql` | Inicialização compatível, retirada do administrador público e atualização aditiva |
| `backend/configurar-admin.js`, `package.json` | Comando local de promoção administrativa |
| `backend/.env.exemplo` | Exemplo opcional de origem do front, sem credenciais reais |
| `backend/testes.test.js` | Regressões de segurança, concorrência, migração, independência de metas e persistência |
| `src/servicos/api.ts` | Chave por tentativa de formulário, erros de conexão/resposta e tipos de ajuda/denúncia |
| `src/screens/account.tsx` | Destino administrativo após login e remoção de credenciais compartilhadas da tela |
| `src/screens/creation.tsx` | Datas válidas, reabertura com motivo, instruções privadas opcionais e envio protegido |
| `src/screens/contributions.tsx` | Intenção simples de objeto, contato privado por telefone/WhatsApp e reenvio protegido |
| `src/screens/finance.tsx` | Novo valor integral simulado, aviso para taxas históricas e reenvio protegido |
| `src/screens/management.tsx` | Recebimento parcial por total acumulado, mensagens de erro, encerramento e reabertura |
| `src/screens/admin.tsx` | Relatos pendentes/analisados, acesso à campanha denunciada e análise conjunta |
| `src/components/campanhas.tsx`, `src/screens/discovery.tsx` | Identificação explícita de campanha encerrada nas listas e no pedido |
| README e documentos desta entrega | Instalação, administração segura, demonstração, riscos e respostas às 24 questões |

Preservados: metas por necessidade, campanhas com um único tipo ou várias necessidades do mesmo tipo, tarefas, atualizações, avisos, eventos e financeiro legado. Retirada apenas a cobrança de novas taxas fictícias; não foram eliminadas telas/rotas de repasse e reembolso com dependências existentes. Esses registros continuam exclusivamente simulados.

Não foram criados chat, logística, upload de prova, confirmação automática, documentos obrigatórios, nova API paralela ou verificação de beneficiário.

## Banco e atualização

Ao executar `npm run servidor`, a API:
1. Cria a tabela `operacoes` com chave composta usuário/identificador e resultado persistente.
2. Acrescenta `campanhas.estado_antes_moderacao`, permitindo distinguir ocultação de encerramento.
3. Retira o papel administrativo somente da antiga conta publicada, pelo motivo de segurança acima.

Nenhuma tabela de negócio é removida, nenhum recebido é zerado, senhas existentes não são trocadas e taxas antigas não são recalculadas. A migração foi testada com o esquema anterior sem os dois novos elementos; a suíte também verifica dados e sessões após reiniciar a API, incluindo recebimentos, valores financeiros antigos e reenvio persistente.

Campanhas antigas já ocultas não têm como informar se estavam encerradas antes da ocultação. Ao publicá-las novamente, a API restaura **encerrada** por segurança; o responsável revisa e reabre se apropriado. Metas e justificativa atuais são mantidas, mas não há versionamento completo de metas/decisões antigas.

O esquema já é criado automaticamente; não execute comandos de reset. Para usar conta administrativa, faça o cadastro normal e execute localmente `npm run admin:configurar -- email-da-conta`, depois entre novamente. A promoção foi validada em banco temporário; não escolhemos uma conta pessoal do usuário para promovê-la.

Na instalação de apresentação existente, a API atualizada iniciou em http://localhost:3001 e a saúde confirmou MySQL/financeiro simulado. As contagens antes/depois permaneceram iguais: 5 usuários, 3 campanhas, 6 necessidades e 2 ajudas; pagamentos, repasses e denúncias continuaram sem registros. A tabela nova iniciou vazia. Os bancos descartáveis usados pela suíte e pela validação web foram removidos separadamente.

## Comandos e resultados

Ambiente: Windows x64, Node 25.6.0 e MySQL local 8.4.8, porta 3307. O README orienta Node 24.19 ou superior. Configuração privada não foi incluída nesta documentação.

| Verificação | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Instalação pelo lockfile passou, 928 pacotes; sem atualização de dependências |
| `npm run banco:local` | MySQL iniciado com configuração existente; dados preservados |
| `npm run testar:backend:local` | **13 testes passaram, 0 falhas** (12 cenários e teste pai), em banco temporário criado/removido pela suíte |
| `npx tsc --noEmit` | Passou |
| `npm run lint` | Passou |
| `npm run compilar:web` | Exportação web passou |
| `npx expo export --platform android --platform ios --output-dir .expo/auditoria-native --max-workers 2` | Bundles Android e iOS exportados |
| Python: AST + dry run dos quatro PoCs | Passaram; nenhuma requisição de exploração enviada |
| `git diff --check` | Sem erros de espaços |
| Git: arquivos privados | `backend/.env` e `backend/.mysql/` ignorados e não rastreados |

A primeira tentativa da suíte falhou porque o MySQL estava parado; depois de iniciá-lo, os testes passaram. Na validação web descartável na porta 3002, o primeiro login foi recusado pela origem: configuramos `ORIGEM_WEB` para essa origem exata, sem ampliar a configuração da aplicação normal.

### Navegador

Verificação manual em banco MySQL descartável, sem alterar os dados de apresentação:
- Visitante abre campanha e necessidade, não vê instrução privada e recebe caminho para login ao tentar contribuir.
- Login de doador, intenção de 3 objetos, instruções/contacto após registro e estado reservado com zero recebido.
- Confirmação pelo responsável de 2 objetos, mantendo 1 reservado, refletida no gerenciamento sem atualizar manualmente.
- Simulação de R$ 20,00 pendente → confirmada com valor integral e meta independente.
- Encerramento com metas incompletas; reabertura pelo formulário com meta 12, validação de motivo obrigatório e manutenção de 2 recebidos.
- Login administrativo direciona ao painel; estado vazio de denúncias e decisão manual de suspensão confirmada.
- Busca sem resultado, limpeza, busca com uma campanha e filtros de região/categoria.
- Layout móvel 390×844 e desktop 1280×900 inspecionados em telas representativas, sem rolagem horizontal nessas verificações.

Criação nova, todos os casos de concorrência/reenvio, permissões negativas, denúncias com histórico e bloqueio de contribuição em campanha encerrada foram exercitados pela suíte API. Nem todas as combinações foram repetidas manualmente pela interface. WhatsApp/ligação não foram disparados para contatos; as ações usam os mecanismos externos existentes. Bundles nativos foram gerados, mas não houve instalação ou teste em aparelho/emulador Android/iOS.

## Open Questions / Assumptions

- Não há comprovação de necessidade, autorização de beneficiário, entrega ou impacto. Relato/recebimento são declarações humanas. Veja [as 24 respostas](LIMITES-DO-PRODUTO.md).
- Não há arbitragem formal, antifraude, MFA, recuperação de senha, limitação de tentativas de login, expiração automática de reservas ou atendimento operacional validado.
- Sessão web fica em sessionStorage; dados do formulário usam a navegação existente e podem permanecer no histórico do navegador. Evite dispositivos compartilhados e informações sensíveis nos rascunhos. Descrições, atualizações e eventos são públicos e dependem de cuidado do autor.
- Registro autenticado de intenção dá acesso ao contato: não impede um usuário mal-intencionado de obtê-lo nem controla conversa externa.
- A idempotência vale para a mesma chave/payload. Clientes antigos sem chave, novo formulário ou novo identificador podem gerar nova intenção. Não há limpeza automática da tabela de operações.
- Dados ilustrativos preexistentes do banco incluem progresso histórico; não representam evidência de uso real e não foram substituídos por valores fictícios no frontend.
- A revisão não inclui teste de carga, auditoria de infraestrutura, pentest externo, análise completa de dependências transitivas ou validação legal de operação pública. Instalação pode emitir avisos de dependências transitivas antigas; não foram feitas atualizações amplas de versões nesta entrega.
- Docker e MySQL instalado separadamente estão documentados, mas esta rodada foi executada com o MySQL próprio do Windows. Não foram provisionados hospedagem, gateway, e-mail ou mapas externos.

## Coverage

Analisados autenticação/sessões, cadastro/perfil, limites do JSON, SQL parametrizado, projeções públicas, permissões administrativas e de propriedade, descoberta/detalhes, campanha e necessidades, ajuda/recebimento/cancelamento, pagamentos/repasses/reembolsos simulados, denúncias, moderação, criação de esquema, arquivos de configuração e rotas do frontend relacionadas. As referências locais da skill OWASP orientaram a revisão. Não é uma certificação de segurança do sistema.

Consulte [DEMONSTRACAO.md](DEMONSTRACAO.md) para apresentar o fluxo e o [README](../README.md) para executar em outra máquina.
