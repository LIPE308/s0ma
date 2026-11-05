# Indicadores sociais e recorte territorial

## Fonte e referência

Os indicadores são da Síntese de Indicadores Sociais 2025 do IBGE, com referência **2024**, consultados em **05/11/2026**. Não representam medição em tempo real nem se apresentam como a série mais recente disponível para qualquer outra finalidade.

- Publicação original: https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/45344-8-6-milhoes-de-pessoas-sairam-da-pobreza-entre-2023-e-2024
- Divulgação via IBGE/Agência Gov: https://agenciagov.ebc.com.br/noticias/202512/8-6-milhoes-de-pessoas-sairam-da-pobreza-entre-2023-e-2024
- Tabela regional reproduzida pela Agência Brasil: https://agenciabrasil.ebc.com.br/es/economia/noticia/2025-12/mas-de-86-millones-de-brasilenos-superan-umbral-de-la-pobreza

A página original do IBGE respondeu 403 nesta consulta. Os números foram conferidos nas publicações da EBC acima, que identificam a SIS e a equipe do IBGE como origem. Não se misturaram percentuais de estudos preliminares com os da SIS 2025.

| Grande região | Pobreza (%) | Extrema pobreza (%) |
| --- | --- | --- |
| Nordeste | 39,4 | 6,5 |
| Norte | 35,9 | 4,6 |
| Sudeste | 15,6 | 2,3 |
| Centro-Oeste | 15,4 | 1,6 |
| Sul | 11,2 | 1,5 |
| Brasil | 23,1 | 3,5 |

Critério desse estudo: US$ 6,85 PPC/dia (PPC de 2017), equivalente a R$ 694 mensais por pessoa em 2024; extrema pobreza: US$ 2,15 PPC/dia, R$ 218 mensais. Não é uma linha oficial única de pobreza adotada para todos os programas brasileiros.

## Leitura do mapa

`src/data/indicadores-sociais.json` guarda os valores e metadados. As cores da camada **Vulnerabilidade social** se referem às cinco grandes regiões. Pintar os estados de uma região com a mesma cor não calcula uma taxa estadual ou municipal. Esse limite aparece na tela e no detalhe da UF.

Faixas visuais, escolhidas apenas para leitura: abaixo de 15%; 15% a menos de 30%; 30% a menos de 38%; 38% ou mais. Não são classes oficiais de risco ou urgência do IBGE. O ranking social é ordenado pela proporção regional de pobreza. Há pobreza também nas regiões com taxas menores.

A camada **Campanhas** conserva os agregados dos registros do app, suas localizações autorizadas e os critérios anteriores de prioridade. Falta de campanha não significa falta de necessidade. A camada estatística não concede urgência, não verifica evidência individual e não distribui anúncios ou dinheiro.

## Campanhas da apresentação

Somente as 12 campanhas criadas pelo projeto foram reposicionadas: dez no Nordeste, cobrindo seus nove estados, e duas no Norte (AM e PA). As campanhas particulares dos usuários não foram movidas. Localizações e textos foram atualizados em transação no MySQL; metas e saldos foram comparados antes/depois e preservados.

Os relatos foram reformulados como propostas de apoio com contexto estatístico verificável. Não se apresentam incêndios, diagnósticos, vítimas ou instituições inventadas como casos reais verificados. O contexto da grande região não prova a situação econômica de uma pessoa ou de uma cidade. Fotos permanecem ilustrativas e individualizadas, com fontes em `assets/photos/campanhas/CREDITOS.md`.

Os dados estatísticos reais são distintos dos registros escolares das campanhas. Uma solicitação real exige cadastro, consentimento, evidência e revisão próprios. Os textos e as localizações do cadastro inicial ficam em `backend/historias-campanhas.json`.

## Verificação

- Cinco regiões, 27 UFs sem repetição; valores, fontes e referência conferidos.
- Doze causas, com dez no Nordeste e duas no Norte.
- Testes existentes de prioridade, filtros financeiros, zoom e câmera preservados.
- Navegação pelas camadas e zoom conferidos no navegador.
