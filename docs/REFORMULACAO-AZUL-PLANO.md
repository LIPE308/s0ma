# SOMA — Reformulação humana em azul

## Auditoria anterior às alterações (26/10/2026)

Base: main 7e44b02. Expo 54, React Native 0.81, React 19, Node HTTP, MySQL. Campanhas, necessidades independentes, doações/repasse simulados, revisão humana, evidências privadas, urgência auditável e fundo 70/30 estão funcionais e serão preservados. Google usa OAuth oficial configurável, sem credenciais ativas. Sessão nativa usa SecureStore; web hoje depende de sessionStorage e precisa evoluir para restauração segura ao reabrir.

Problemas encontrados: abertura pública com introdução longa e som; seis atalhos competindo na home; vários cabeçalhos/cartões repetidos; perfil mistura formulário e histórico; etapas de criação mostram ferramentas antes da história; estrada 3D e seu bundle competem com a solidariedade. Pagamentos são simulações, sem provedor real. Não existe previsão publicitária válida sem histórico suficiente.

## Direção revisada

A instrução direta do usuário mantém o azul, sobrepondo o verde do documento. Paleta: azul royal #1748F5, azul profundo #153A99, azul suave #EDF3FF, branco #FFFFFF, fundo #F7F9FC, texto #17243B. Verde #24735B fica restrito a sucesso e ao pequeno contexto de anúncios, com equivalente acessível no tema escuro. Manrope continua para leitura e Sora para títulos, sem nova fonte externa.

As imagens fornecidas orientam fotografia, agrupamento e ações claras; não serão copiadas nem usadas para inventar campanhas/beneficiários. A recomendação automática local sugeriu outras fontes/cor laranja e tratamento editorial: essas escolhas foram rejeitadas por conflitarem com a identidade e com a prioridade móvel. Aproveitam-se foco visível, alvos de toque e divulgação progressiva.

Layout: login com foto e marca, controles em uma área clara; home alinhada à esquerda com saudação, destaque humano e três ações; campanhas com imagem/história/progresso; gerenciamento com valor, cartão pequeno de anúncios e ferramentas recolhidas. Perfil começa com identidade e linhas de navegação. Acompanhamento vira uma lista/trilha 2D, com detalhes financeiros por abertura explícita.

Login: foto + marca → Google quando configurado / e-mail funcional → complemento curto → home.
Campanha: história → imagens/documentos → meta → revisão → rascunho privado → análise humana.
Doação: campanha → valor → revisão → confirmação simulada.

## Fases de implementação

1. Sessão persistente web em cookie HttpOnly e restauração; introdução mínima sem áudio; remover componentes e dependências exclusivos do 3D.
2. Novo login, complemento de perfil, home, lista/detalhe de campanhas, perfil e convite/compartilhamento.
3. Criação progressiva e gerenciamento simplificados, cartão de anúncios com valores confirmados separados de hipóteses; preservar regras e permissões.
4. Testes de jornadas e sessão, exportações, inspeção em 320/360/390/430 pixels, documentação e push normal para main.

## Referências e limites

- Referências visuais anexadas pelo usuário.
- https://www.gofundme.com/c/how-it-works — história/foto e compartilhamento explícito; nenhuma regra financeira de terceiros será copiada.
- https://developers.google.com/identity/branding-guidelines — botão e marca Google.

Não haverá deploy, receita real, promessa de crescimento ou login Google falsificado. Credenciais/consentimento no Google Cloud dependem da equipe. Testes em dispositivos físicos e validação jurídica continuam fora desta execução.
