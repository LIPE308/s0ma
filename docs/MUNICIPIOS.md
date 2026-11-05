# Municípios e territórios

O catálogo local contém 5.571 registros da API Localidades do IBGE, consultada em 05/11/2026. A busca funciona sem internet, a partir de dois caracteres, ignora acentos e apresenta até oito sugestões com nome e UF. Homônimos são identificados pela UF. O Distrito Federal está incluído conforme o catálogo do IBGE.

Fonte do catálogo: https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome

A rota `/mapa-cidades`, acessível pelo Mapa Solidário, carrega os contornos de uma UF por vez. Busca, toque no território, foco municipal, zoom e arraste reutilizam os controles do mapa existente. As cores usam apenas campanhas publicadas com localização autorizada e urgência revisada. Não são taxas municipais de pobreza. Os indicadores regionais continuam no mapa do Brasil.

As malhas simplificadas vêm da API v3: `https://servicodados.ibge.gov.br/api/v3/malhas/estados/{UF}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`. Elas servem para navegação visual, sem precisão cadastral. São 5.570 contornos: Boa Esperança do Norte/MT (5101837) consta no catálogo, mas ainda não tem contorno nesse retorno da API. A interface informa essa ausência e permite selecionar a cidade sem inventar limites. Metadados em `src/data/malhas-municipais/fonte.json`.

Os seletores foram integrados ao perfil, configurações, criação simples, criação avançada e preparação da publicação. No fluxo simples, o consentimento para aparecer no mapa exige cidade selecionada. O contexto da campanha salva município oficial e UF no MySQL existente; nenhum endereço residencial ou GPS é solicitado. Cadastros legados sem município permanecem visíveis somente no agregado estadual até o responsável preencher a cidade. Nenhuma campanha é atribuída automaticamente à capital.

## Atualizar os dados

1. Baixar a resposta Localidades para `.expo/geografia/municipios.json` e atualizar `src/data/municipios-brasil.json` com `id`, `nome`, `uf`. A UF vem de `microrregiao.mesorregiao.UF` ou, se ausente, de `regiao-imediata.regiao-intermediaria.UF`.
2. Baixar a malha de cada uma das 27 UFs para `.expo/geografia/{UF}.json`, usando o endpoint acima.
3. Executar `python scripts/gerar-municipios.py`. Ele projeta e simplifica a representação para coordenadas locais e registra contornos ausentes em `fonte.json`. Rever a data de consulta no gerador e nesta documentação.
4. Executar `node --test backend/municipios.test.js`, `npm run testar:mapa`, `npm run verificar:tipos`, `npm run lint` e `npm run compilar:web`. Se o IBGE ampliar o catálogo, revisar as contagens esperadas dos testes junto com a fonte.

As respostas brutas ficam na pasta ignorada `.expo`. Catálogo e contornos compactos são versionados e incluídos no aplicativo. Não há consulta ao IBGE em cada digitação nem dependência nova nativa. Esta entrega não publica OTA nem altera autenticação, doações ou estrutura do banco.

## Validação desta entrega

Tipos, lint e exportação web concluídos. Nove testes automatizados do mapa, gestos, catálogo e cobertura dos contornos passaram. No navegador foram conferidos: seleção por teclado sem acentos, cidades homônimas, campanha de Petrolina/PE, foco municipal, zoom e arraste com mouse, pinça e arraste por eventos touch, ausência de transbordamento em 390 px e mensagem para município sem contorno. O retorno sem sessão na API de autenticação é esperado para a consulta pública do mapa. A versão nativa ainda precisa ser conferida em aparelho físico na próxima build de teste.
