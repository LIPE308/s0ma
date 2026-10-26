# SOMA 2.0 — validação da integração

Entrega local de 26/10/2026. Base inicial 6bf9b56, integrada aos commits da main até 6d63efd. Sem deploy público ou operação financeira real.

## Verificações automatizadas

- 42 testes do backend aprovados: regras, jornadas MySQL, regressões e compatibilidade com o esquema anterior. A contagem inclui testes-pai reportados pelo executor.
- Dois testes de experiência aprovados: calendário brasileiro, anos bissextos, cinco objetivos e representação da finalidade real.
- Quatro testes das funções legadas aprovados, mantidos como regressão; os critérios ativos do fundo/urgência são os da suíte SOMA 2.0.
- TypeScript e lint sem erros. Dependências alinhadas ao Expo SDK 54.
- Exportação web com Three.js em arquivo separado, carregado pela estrada.
- Exportações Android (3,71 MB) e iOS (3,72 MB) aprovadas. Os bundles verificam compilação; não equivalem a teste em celular físico ou publicação nas lojas.

Comandos: npm run testar:backend:local; npm run testar:experiencia; npm run testar:inteligencia; npx tsc --noEmit; npm run lint; npx expo install --check; npm run compilar:web. Nativos: npx expo export --platform android --platform ios --output-dir .expo/soma2-native --max-workers 2.

## Evidências de integridade

As suítes criam bancos temporários separados e removem apenas esses bancos no encerramento. Não executam reset do banco soma.

O teste de compatibilidade constrói o esquema anterior com perfil institucional, biografia/foto, UF, identidade Google e receita simulada já distribuída. Após migrar, mantém os registros originais, reconhece os R$ 24,50 de anúncio uma única vez e conserva o total após reiniciar. O perfil importado permanece privado e sem declaração de maioridade inferida. JPEG e PNG passam pela validação/remoção de metadados; bytes não interpretáveis permanecem na fonte antiga.

O teste da criação em três passos verifica foto/UF na mesma transação, reenvios concorrentes com uma única campanha, planejamento privado e rejeição de imagem/UF inválida sem campanha parcial. O fluxo antigo de distribuição direta retorna 410 para exigir o painel conciliado.

Outros cenários incluem: prioridade não concedida pelo formulário, documento insuficiente, prazo/evidência vencidos, recurso/histórico, terceiros sem acesso a documentos, deduplicação de campanhas, receita não conciliada, rateio concorrente, 70/30 em centavos, teto por responsável, meta atingida, fundo sem elegíveis, ausência de projeção sem histórico, preservação de liquidez, campanha encerrada e edição de imagem exigindo revisão.

Antes da migração no banco local foram registrados: 5 usuários, 1 sessão, 3 campanhas, 6 necessidades, 2 ajudas e 2 atualizações; pagamentos, repasses e denúncias estavam zerados. Metas financeiras somavam 200000 centavos e recebidos 125000 centavos. A conferência após migração preservou essas quantidades e somas. Nenhuma conta, senha ou campanha foi apagada.

## Inspeção de interface e limites

Na validação anterior à integração, em banco temporário, foram executados pela interface: login, criação de campanha apenas de objetos, salvamento/preparação/envio, revisão administrativa e publicação regular; personalização/biografia; seleção de estado e filtros do mapa; detalhes dos marcos e painel de auditoria. Os créditos usados nessa inspeção eram fictícios e identificados como demonstração.

Foram inspecionados tema escuro em 375 × 844, mapa em 844 × 375 e tema claro em 1280 × 900, sem rolagem horizontal do documento nesses cenários. A integração final conserva os tokens royal, a navegação simplificada e o carregamento separado da estrada 3D. Na versão integrada, a estrada 3D foi aberta com a campanha Biblioteca para todos, total histórico de R$ 1.250,00 e meta de R$ 2.000,00. Selecionar objetivos futuros não alterou os 62,5% confirmados. Foram conferidos 3D e trilha leve em 375 × 844 e na largura normal de 701 pixels, sem excesso horizontal do documento; a visualização temporária foi restaurada. O filtro Sul do mapa exibiu PR/SC/RS e manteve o estado vazio por ausência de localização autorizada no banco local. Nenhuma localização foi inventada a partir dos textos legados.

A revisão de acessibilidade considerou rótulos, formas alternativas ao arraste, estados textuais dos marcos e movimento reduzido no contexto compartilhado. Não foram executados teste com leitor de tela, maior tamanho de fonte do sistema, aparelho físico ou auditoria completa WCAG. Não há declaração de conformidade total.

## Pendências reais

Google web exige credenciais oficiais e teste de ponta a ponta; Google nativo exige clientes/configuração/build próprios. Anúncios não têm provedor ativo. Doações, fundo, repasses, saldos e cenários de rendimento são exclusivamente simulados. Não há custódia, investimento ou rendimento creditado.

Revisão humana, atendimento, verificação independente de identidade/necessidade, antivírus, privacidade operacional, retenção/exclusão de documentos e validação jurídica de LGPD precisam de processos próprios antes de operação pública. Maioridade é autodeclaração. Não houve teste de carga ou pesquisa com participantes reais.

O npm audit após unir os lockfiles/overrides compatíveis reportou 8 alertas transitivos: 3 moderados e 5 altos, nenhum crítico. As correções compatíveis foram aplicadas; não se utilizou atualização forçada que quebrasse o Expo. Esses alertas permanecem como limitação e não representam auditoria de exploração em produção.
