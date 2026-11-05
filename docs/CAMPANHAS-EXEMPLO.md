# Campanhas de exemplo e demonstração financeira

Para adicionar os 12 exemplos em uma instalação MySQL local já inicializada:

```powershell
node backend/campanhas-exemplos.js
```

O comando carrega `backend/.env`, exige MySQL em localhost e cadastra as campanhas em uma transação. Só inclui IDs ausentes, sem apagar ou atualizar campanhas existentes. Cria uma conta organizadora de demonstração sem privilégios administrativos e com senha aleatória, sem disponibilizar esse login. Rodar novamente não duplica os dados.

São quatro emergências fictícias e oito outras causas, identificadas pelo prefixo `exemplo-`. Na apresentação escolar, a interface usa linguagem natural nas campanhas, sem selos de exemplo. A origem dos dados permanece registrada aqui e nos IDs. Não são inseridas aprovações de urgência nem evidências falsas na tabela `urgencias`. A ordenação visual prioriza urgências críticas revisadas, depois emergências de exemplo, depois as demais. As fotos são ilustrativas. Os exemplos possuem metas e valores recebidos fictícios; não foram inseridos pagamentos, receitas publicitárias, aplicações ou repasses.

O simulador financeiro aparece na campanha e no gerenciamento. Inicia automaticamente em campanhas de exemplo e no painel do responsável, inclusive após criar um rascunho. Nas outras campanhas, é iniciado pelo botão. O cenário parte do saldo registrado da própria campanha e avança a cada dois segundos, com parâmetros determinísticos derivados do ID da campanha para diferenciar as projeções. O painel do responsável mostra saldo projetado, meta cadastrada, percentual, barra de progresso e valor restante, todos calculados a partir do mesmo total. A apresentação pública para quem não é responsável mostra somente a receita projetada dos anúncios no painel de evolução. Os indicadores financeiros usam as cores verdes semânticas do tema. Para após 60 etapas, permite pausar/reiniciar, respeita movimento reduzido e suspende o contador ao sair da tela ou colocar o app em segundo plano.

O contador é uma demonstração local, reiniciada ao abrir outra campanha. Não grava no MySQL, não altera o saldo registrado, não promete rentabilidade e não representa rendimento bancário real. O saldo registrado permanece visível em seção separada.

Verificado localmente: 12 inclusões na primeira execução e zero na segunda; contador aumentando na interface sem alteração do valor recebido da campanha no banco.

A tela inicial conserva a organização anterior: saudação, destaque principal, atalhos e apenas duas campanhas na seção de destaque existente, com prioridade às emergentes. A lista completa de campanhas fica na tela de causas (`/explorar`).

Cada uma das 12 campanhas possui foto própria, associada explicitamente ao ID em `src/data/fotos-campanhas.ts`. Não existe mais fallback que reutilize uma foto por categoria. Imagens enviadas pelos responsáveis continuam prioritárias; campanhas novas sem foto mantêm um espaço reservado. Fontes e licença estão em `assets/photos/campanhas/CREDITOS.md`.

As 12 narrativas foram ampliadas para a apresentação escolar, sem mudanças em metas, saldos ou revisões de urgência. O texto está em `backend/historias-campanhas.json`, utilizado também pelo cadastro inicial. São histórias criadas para este projeto, sem vínculo entre as pessoas das fotos e os relatos.

A projeção de anúncios só existe nas emergências ativas: urgência crítica com revisão vigente ou os quatro casos emergenciais da apresentação. Campanhas comuns não ganham anúncios no total projetado e não exibem essa linha; visitantes não veem painel publicitário nessas campanhas. O backend já limita a distribuição efetiva do fundo às urgências críticas ativas, revisadas e com evidência válida. Não foram aprovadas urgências nem gerados créditos para os exemplos.
