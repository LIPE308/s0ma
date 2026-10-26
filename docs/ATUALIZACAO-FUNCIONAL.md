# Atualização funcional do Soma

> Registro da versão 6d63efd e anteriores. A integração atual preserva a experiência descrita e atualiza os contratos de API, publicação, privacidade, urgência e conciliação: [guia SOMA 2.0](SOMA-2.md) e [validação atual](SOMA-2-VALIDACAO.md).

## Auditoria e preservação da base

Repositório correto: `LIPE308/s0ma`. Base: `6bf9b56`, branch `main`, sem mudanças locais. A branch remota `mudancas-jf` estava sete commits atrás da `main`, sem commits exclusivos. O trabalho parte da `main` na branch temporária `atualizacao-funcional-soma`. Os commits validados são incorporados por avanço direto à branch de desenvolvimento existente `mudancas-jf` antes da integração à `main`, preservando todo o histórico. A outra cópia local em `Documents/Codex/SOMA` permanece sem alterações de código.

Arquitetura preservada: Expo SDK 54, React Native 0.81, React 19, Expo Router; Node HTTP com SQL parametrizado e MySQL 8.4. Sem acesso ao banco no cliente. Permanecem cadastro/senha com scrypt, sessões revogáveis no MySQL, campanhas com múltiplos pedidos, reserva concorrente, recebimento parcial, contribuições financeiras de teste, repasses de teste, atualizações, denúncias, moderação e permissões verificadas na API.

As telas existentes de criação, gestão, campanha, entrada, exploração, perfil e administração recebem as novas funções. Rotas adicionadas: `/rota-inteligente?id=...`, `/mapa`, `/solidariedade-admin` e `/google`. A navegação para elas está disponível na campanha, início, administração e entrada. O mapa e a rota funcionam sem login para campanhas públicas; edições e análises exigem os responsáveis correspondentes.

## Rota e financeiro

- Estrada curva em Three.js na web, câmera em perspectiva, moedas, coração, anúncio, gráfico e troféu modelados com geometria, iluminação e materiais consistentes. Seleção por toque/clique e controles acessíveis por teclado. Renderização sob demanda e durante transições curtas; resolução limitada a 1,5 vezes a densidade de tela, sem loop permanente. Recursos de GPU são liberados ao sair. Three.js é carregado em um arquivo separado.
- Alternativa 2,5D com controles nativos para Android/iOS e quando WebGL não pode ser iniciado ou perde o contexto. Não se instala renderizador WebGL nativo incompatível com Expo Go. Alternativa em lista disponível em todos os dispositivos. Movimento reduzido respeita o sistema.
- Meta, recebido, percentual, restante e saldo vêm do MySQL. A jornada reúne doações confirmadas de teste e anúncios distribuídos de teste. Os anúncios têm livro separado e **não autorizam repasse** pelo fluxo dos pagamentos. O saldo disponível desconta repasses reservados e concluídos.
- Marcos condicionais não dependem apenas da arrecadação: anúncio só conclui com distribuição registrada; rendimento permanece futuro porque não há prestador financeiro conectado. Datas financeiras novas são registradas na transação de confirmação/distribuição. Datas ausentes do histórico legado são declaradas indisponíveis, sem inventar o dia do alcance.
- A simulação educativa solicita ao usuário taxa mensal (0 a 2%) e anúncios mensais em reais, inicialmente zero. Horizonte de um mês na interface; API admite de 1 a 24. Juros compostos sobre o saldo de pagamentos, sem taxas/impostos e sem garantia; valores estimados não alteram registros confirmados. A interface explica liquidez, riscos, prazo e disponibilidade imediata em emergências.

## Urgência e fundo solidário

O responsável envia um relato privado e referências das evidências na gestão da campanha; também pode enviar recurso após a decisão. Há apenas uma solicitação pendente por campanha. Um novo pedido ou edição da campanha invalida a verificação anterior. A preferência antiga Normal/Alta entre pedidos passa a ser descrita como ordem sugerida pelo responsável, sem conceder prioridade no fundo.

Um administrador diferente do responsável informa critérios comprovados: gravidade 0–3 (até 30 pontos), consequência 0–3 (até 30), prazo futuro de até sete dias (20) ou trinta dias (10), documentos conferidos (10), consistência (10). Crítica exige pelo menos 75 pontos, documentos e consistência; Moderada exige 45 e os mesmos dois requisitos; as demais são Regulares. O prazo é calculado pelo servidor. Regras, versão, justificativa, revisor, pontuação, criação, decisão e validade ficam registrados. Verificações expiram em sete dias; denúncias e moderação anteriores continuam disponíveis. A regra é determinística, sem integração com IA.

**A revisão exige trabalho humano real.** O sistema registra a declaração do revisor, não comprova a autenticidade de um documento automaticamente. Nesta versão não recebe arquivos médicos ou documentos de identidade: armazena apenas referências privadas e relatos, acessíveis ao responsável e administradores. Um cofre documental com criptografia, política de retenção, controle de acesso e verificação de arquivos ainda precisa ser contratado/configurado antes desse tipo de upload.

O painel registra somente receita publicitária líquida elegível **simulada**, com referência única e identificador de reenvio. O cálculo reserva 70% ao fundo e 30% à manutenção, em centavos inteiros. Somente campanhas ativas, críticas, com revisão vigente, prazo não vencido e meta financeira restante entram no rateio. Peso:

`(pontuação / 100) × (1 + 7 / (dias restantes + 7)) × restante / (restante + distribuições anteriores + 1)`.

Cada campanha recebe no máximo 35% do fundo daquela receita e nunca mais que sua necessidade restante. A soma distribuída mais o retido é exatamente 70%; arredondamentos e falta de elegíveis permanecem retidos. Receita, critérios e distribuição são confirmados juntos, com bloqueio das campanhas e proteção contra lançamentos duplicados. A referência repetida com outro envio é recusada. Reenviar o mesmo identificador devolve o recibo anterior. Não há rede publicitária, cobrança, transferência nem receita real. O espaço reservado explica o modelo sem gerar receita por visita.

## Mapa, filtros e imagens

Malha simplificada dos 27 estados obtida do [IBGE, API Malhas v3](https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=UF), em 23/10/2026. A geometria é empacotada com o aplicativo, sem requisição externa ao abrir o mapa. Círculos translúcidos representam quantidade de campanhas filtradas por UF; não são um índice de necessidade social. Há seleção de estado/região, categoria, urgência, verificação, zoom, arraste e gesto com dois dedos, além de controles textuais acessíveis. Campanhas sem UF aparecem na lista nacional e são contadas separadamente; não recebem coordenadas inventadas a partir do bairro.

UF pública é opcional e informada pelo responsável na gestão. O mapa não consulta endereço, telefone ou documentos. A verificação exibida se refere à revisão de urgência, não à confirmação geográfica.

Explorar mantém os filtros existentes de busca, categoria e região e acrescenta urgência revisada, verificação, meta financeira máxima, ordenação recente, prazo próximo e proximidade da conclusão financeira. Campanhas comuns continuam presentes por padrão. A comparação financeira não mistura objetos e vagas.

O responsável pode adicionar uma foto de campanha pelo seletor do dispositivo. Perfil recebe foto, capa, biografia, tipo pessoa/instituição, contagem de campanhas e ajudas com recebimento, indicação de participação e preferência de exibição de apoios. O histórico pessoal permanece privado; a preferência é preparada para uma futura página pública, que não está publicada nesta versão. Fotos aceitas: PNG/JPEG/WebP até 50 KB por imagem; SVG e URLs externas são recusados. O corpo JSON tem limite de 160 KB para acomodar foto e capa. A edição de nome, contato, localização, temas e notificações existente foi preservada.

## Google: configuração necessária e limites de validação

O fluxo web implementa código de autorização oficial com PKCE S256, `state`, `nonce` e cookie HttpOnly SameSite=Lax (Secure em HTTPS), troca do código no servidor e validação de assinatura, emissor, audiência, expiração e e-mail verificado pelo cliente oficial `google-auth-library`. Não há segredo Google no aplicativo. O retorno usa um código descartável de 60 segundos vinculado ao cookie do navegador; o token de sessão não vai na URL. A sessão resultante usa a tabela de sessões existente e o logout revoga a sessão no servidor.

Criar um cliente **Aplicativo da Web** no Google Cloud, configurar a tela de consentimento, escopos OpenID/e-mail/perfil e usuários de teste, se o aplicativo estiver em testes. Para executar tudo no endereço local padrão:

```dotenv
# Acrescentar SOMENTE a backend/.env, arquivo ignorado pelo Git.
GOOGLE_CLIENT_ID=<ID do cliente web>
GOOGLE_CLIENT_SECRET=<segredo do cliente web>
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/retorno
ORIGEM_WEB=http://localhost:3001
```

Cadastrar exatamente `http://localhost:3001/api/google/retorno` como URI de redirecionamento autorizada e `http://localhost:3001` como origem web no Google Cloud. Reiniciar o backend. Para desenvolvimento em 8081, usar `ORIGEM_WEB=http://localhost:8081` e autorizar essa origem; a URI de retorno continua no backend. Utilizar sempre o mesmo hostname, sem alternar localhost e 127.0.0.1. Fora do ambiente local, configurar HTTPS tanto para o front quanto para o callback, domínio autorizado, consentimento e revisão exigida pelo Google. Não há deploy automático.

Contas novas Google são criadas com identidade única por `sub`. Se o e-mail já existir, não há vinculação automática: entrar com a senha da conta existente e usar **Vincular conta Google** no perfil. A sessão original deve continuar válida no callback. Identidade já vinculada a outra conta é recusada. O cadastro não permite promover a própria conta a administrador. O estado temporário do OAuth fica em memória por dez minutos; reiniciar o backend durante o fluxo exige começar novamente. As sessões concluídas permanecem no MySQL.

**Não foi realizado login Google com credenciais válidas**, pois as credenciais não foram fornecidas. Os testes cobrem indisponibilidade sem configuração e rejeição de resgate inválido, além das sessões próprias existentes. O fluxo web ainda precisa do teste completo com uma conta autorizada, incluindo cancelamento, primeiro acesso, e-mail já existente, vinculação, retorno e logout. Android/iOS usam login por senha; OAuth nativo depende de clientes próprios, identificadores de pacote, certificados e build assinado e não é anunciado como concluído. Persistência nativa usa Expo SecureStore, carregado antes de exibir as telas; o cofre precisa ser validado em dispositivo. Na web, a sessão existente usa sessionStorage: resiste a recarregamento na aba, não promete sobrevivência ao fechamento do navegador.

## Banco e validação

O servidor aplica `backend/extensoes.sql` com tabelas novas, sem apagar nem alterar tabelas existentes. O cliente MySQL continua no backend. Sessões Google usam o mesmo prazo de 24 horas. Nenhum arquivo `.env`, senha de banco local ou token deve entrar no Git.

Testes de regras: `npm run testar:inteligencia`. Integração MySQL: `npm run testar:backend` ou `npm run testar:backend:local` na instalação local correspondente. Banco temporário `soma_teste_...` criado/removido pela suíte, sem apagar `soma`. Tipos: `npm run verificar:tipos`. Lint: `npm run lint`. Compilação: `npm run compilar:web`. A saída `dist/` não é versionada: recompilar no outro computador após `npm ci`.

As validações finais, versões, dependências ainda sinalizadas e evidências visuais são registradas em `VALIDACAO-FUNCIONAL.md`. Revisões de documentos, antifraude e urgência são recursos de apoio à equipe e não substituem a avaliação humana. Pagamentos reais, rede de anúncios, investimentos, cofre documental e Google configurado permanecem dependências externas distintas.
