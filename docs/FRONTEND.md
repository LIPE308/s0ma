# Soma / Pulso — front acadêmico

As 35 rotas foram adaptadas dos arquivos de referência e dos cinco slides enviados. A interface usa View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, StyleSheet, Switch, Modal, Stack, Tabs, Ionicons e componentes com props. O front inicial era uma demonstração local; a solicitação posterior autorizou o backend Node.js e o banco MySQL.

## Origem nos slides

| Recurso | Aula / slides |
| --- | --- |
| View, Text, ScrollView | A01, 4–7 |
| TextInput controlado e senha | A01, 8; A02, 13–14 |
| TouchableOpacity e botões | A01, 9; A02, 11–12 |
| FlatList e listas vazias | A01, 10; A05, 5–13 |
| StyleSheet, cores e Flexbox | A01, 11; A02, 2–16 |
| Switch e Modal | A01, 12–13 |
| Stack, Tabs, Ionicons e rotas | A05, 15–20 |
| Componentes, props e children | A05, 23–28 |
| useState e atualização de arrays | A05, 31–33 |

A integração usa fetch e useEffect para consultar o servidor e exibir carregamento/erro. Não adicionamos bibliotecas de formulário, estilos ou estado. O backend acrescenta o driver `mysql2`, conforme a nova solicitação. Os documentos anexados orientam o produto; recursos de IA, recuperação por e-mail e pagamentos reais descritos nas referências não fazem parte desta implementação básica.

## Estrutura

- `app/`: rotas e cinco abas.
- `src/components/`: componentes visuais e mensagens de conexão.
- `src/screens/`: telas por fluxo, com formulários em useState.
- `src/servicos/api.ts`: fetch, sessão e carregamento das consultas.
- `src/data/formatacao.ts`: categorias e formatação de valores.
- `backend/`: API e esquema do MySQL.
- `examples/`: exemplos anteriores, fora do roteamento.

O rascunho da campanha passa dados pelos parâmetros entre as quatro etapas. Ao salvar a revisão, a API grava a campanha e os pedidos em uma transação. Cadastro, atividade, ajudas, atualizações, denúncias e administração usam dados do MySQL. A sessão sobrevive ao recarregamento da aba web. Pagamentos e repasses são testes salvos no banco, com essa indicação nas telas.

Para executar, consulte o [README](../README.md). Para configurar o banco e estudar as regras, consulte o [backend](BACKEND.md).

## As 35 telas

| Referência | Rota |
| --- | --- |
| 01 Entrar | `/entrar` |
| 02 Criar conta | `/criar-conta` |
| 03 Verificar ou recuperar acesso | `/acesso` (`modo=recuperar` para recuperação) |
| 04 Início | `/` |
| 05 Explorar e região | `/explorar` |
| 06 Campanha | `/campanha` (`id=familia`, `biblioteca` ou `abrigo`) |
| 07 Necessidade | `/necessidade` (`id=cobertores`, `alimentos`, `organizar`, `equipamento`, `abrigo` ou `livros`) |
| 08 Atualizações | `/atualizacoes` |
| 09 Contribuir com objeto | `/contribuir` |
| 10 Voluntariado | `/voluntariado` |
| 11 Ação da campanha | `/acao` |
| 12 Doação e pagamento | `/doacao` |
| 13 Acompanhar pagamento | `/pagamento` |
| 14 Revisar ajuda | `/revisar-ajuda` |
| 15 Minha atividade | `/atividade` |
| 16 Detalhe da ajuda | `/ajuda` |
| 17 Campanha: história | `/criar` |
| 18 Campanha: necessidades | `/pedidos` |
| 19 Adicionar ou editar necessidade | `/editar-necessidade` |
| 20 Campanha: organização | `/organizacao` |
| 21 Revisão da campanha | `/revisao` |
| 22 Gerenciar campanha | `/gerenciar` |
| 23 Confirmar realização | `/confirmar` |
| 24 Publicar atualização | `/publicar` |
| 25 Saldo e repasses | `/saldo` |
| 26 Solicitar repasse | `/solicitar-repasse` |
| 27 Detalhe do repasse | `/repasse` |
| 28 Limite da meta fechada | `/excedente` |
| 29 Perfil e identificação | `/perfil` |
| 30 Avisos e preferências | `/avisos` |
| 31 Denunciar campanha | `/denunciar` (modal) |
| 32 Resultado e impacto | `/resultado` |
| 33 Administração | `/administracao` |
| 34 Análise da campanha | `/analise` |
| 35 Operação financeira | `/operacao` |

## Verificações

```bash
npx tsc --noEmit
npm run lint
npm run compilar:web
npm run testar:backend
```

O backend é testado em um banco isolado. A web é validada no navegador com fluxos autenticados, criação de campanha, contribuição e operações financeiras de teste. Android/iOS não foram validados.
