# SOMA 2.0 — auditoria e plano de execução

Base: 6bf9b56. Escopo autorizado: implementar o briefing de 22/10/2026 e publicar na main, sem implantar serviço público ou movimentar dinheiro real.

## Auditoria antes de alterações

React Native 0.81/React 19, Expo 54, Expo Router com 35 rotas, TypeScript no cliente. Node HTTP, mysql2, MySQL 8.4.8. Sem ORM ou provedor financeiro/publicitário. Tokens aleatórios de 24h com resumo SHA-256, scrypt para senhas; permissões no servidor. Banco existente preservado.

Implementado: contas, perfil básico, campanhas com necessidades independentes, reserva, recebimento parcial, tarefas, eventos, atividade, atualizações, denúncias/moderação, pagamento/repasse/reembolso exclusivamente simulados, idempotência e migração aditiva. Limitações documentadas na auditoria anterior.

Ausente: trilha da Rota Inteligente, classificação auditável de urgência, evidências privadas, distribuição de anúncios, mapa, filtros avançados, perfil personalizado, Google. Não existem integrações externas ativas. O fluxo atual publica novas campanhas diretamente; o novo briefing exige revisão prévia.

## Fases

1. **Integridade:** extensão aditiva do banco, lançamentos e auditoria; publicação após revisão; evidências privadas e urgência determinística/humana.
2. **Núcleo:** distribuição simulada 70/30 com limites por responsável, sem crédito por impressão; Rota Inteligente e projeções com hipóteses explícitas.
3. **Descoberta:** mapa agregado por UF e consentimento, feed equilibrado, filtros, perfis e Google configurável.
4. **Entrega:** testes adversos e jornadas, web e bundles nativos, inspeção visual, documentação e commit/push na main.

## Direção visual

Preservar azul royal #1748F5, base #FAF7F1, papel #FFFEFB, texto #272B38, verde de cuidado #345642 e terracota #A7442A, com equivalentes já existentes no tema escuro. Manrope no texto e Sora nos títulos. A busca de design sugeriu acessibilidade e transparência, mas suas cores/fontes e CTA comercial não servem ao SOMA e não serão aplicados.

A Rota é uma trilha de marcos conectados, com posição alternada e detalhes acionáveis; origem dos valores vem ao lado do caminho, sem transformar a página em grade bancária. O mapa usa contorno do Brasil e estados, agregação e círculos de intensidade explicada. Teclado, texto, alvos de toque, contraste e movimento reduzido fazem parte da implementação.

## Dependências externas reais

Google exige projeto OAuth, client ID/secret e URI autorizada. Sem chaves fornecidas, ficará desativado com instruções; não será declarado validado de ponta a ponta. A publicidade real exige provedor e conciliação: esta entrega usa somente simulação administrativa. Não haverá aplicações automáticas, custódia ou rendimentos inventados. A cartografia oficial do IBGE será empacotada para não depender de rede ao navegar no mapa.

## Resultado da execução

As quatro fases foram implementadas e verificadas dentro do escopo local e simulado. O estado inicial acima é a auditoria anterior às alterações. Consulte [implementação e regras](SOMA-2.md) e [validação final e pendências](SOMA-2-VALIDACAO.md). Google real, anúncios de provedor, operações financeiras e validação em aparelhos dependem da infraestrutura indicada nesses documentos.
