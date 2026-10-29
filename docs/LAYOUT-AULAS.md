# Layout próximo dos exemplos de aula

Referência consultada: Geekie One → Codificar aplicações para dispositivos móveis → postagem do professor Rodrigo → OneDrive “Materiais de aula - Aplicações mobile” → “Código aula 07-05-2026/index.tsx”. O exemplo usa função de componente, View, Text, TextInput e StyleSheet.create. A pasta também contém as apresentações de componentes, estilos e revisão de navegação/estados.

## O que foi simplificado

- `src/screens/inicio.tsx`: JSX organizado em blocos; estilos nomeados em criarEstilos; nomes router, pessoa, campanhas, campanha e acao no lugar de letras isoladas.
- `src/components/ui.tsx`: componentes compartilhados com JSX legível; botão Voltar usa if/else; espaçamento responsivo usa condições explícitas.
- `app/(tabs)/_layout.tsx`: configuração das abas organizada para leitura, mantendo as rotas e animações existentes.

Separar estilos aumenta o número de linhas, mas permite localizar e explicar cada parte sem percorrer uma linha enorme. Não foram adicionadas bibliotecas para esta refatoração.

## Como explicar a tela inicial

1. Os imports trazem os componentes utilizados.
2. Inicio consulta a pessoa, as campanhas e a largura disponível.
3. Os arrays ativas, revisadas e destaques selecionam as campanhas exibidas.
4. O return contém a estrutura: cabeçalho, saudação, foto, atalhos e campanhas.
5. criarEstilos contém medidas, cores e alinhamentos em StyleSheet.create, como no exemplo do professor. Recebe as cores e a largura para preservar tema claro/escuro e responsividade.

Screen, Button e Copy são componentes reutilizados. Continuam apoiados nos componentes básicos do React Native. O sistema de sessão, acessibilidade, gestos e animações existente foi preservado; substituí-lo exigiria uma mudança funcional, além de organizar o layout.

A organização foi estendida às telas de campanhas, criação, doação, perfil, mapa, administração e demais telas, componentes e rotas. Estilos fixos foram extraídos em 19 arquivos para StyleSheet.create; 84 declarações agrupadas foram separadas para leitura. Estilos que dependem de estado ou tema permanecem próximos dos dados de que precisam. Nomes de variáveis dos fluxos principais foram esclarecidos. Não foram criadas novas camadas de estado ou navegação.

Validação: TypeScript, lint, exportações web e Android, integração com MySQL, testes de relatórios/OAuth e gestos do mapa. A alteração do layout não muda as regras do backend. Este conjunto também publica o painel administrativo e suas integrações já desenvolvidos; valores financeiros continuam explicitamente simulados. A prévia de divisão de receita usa cálculo em centavos, sem arredondamento por multiplicação decimal.
