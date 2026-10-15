# Ajustes pontuais de UX — 15/10/2026

A estrutura das telas e os fluxos principais foram mantidos.

| Onde | O que foi corrigido |
| --- | --- |
| Necessidade | “Tipo de ajuda”, “Limite de arrecadação” e “Prioridade da necessidade” agora identificam os grupos. Textos curtos explicam Normal/Alta e Fechada/Aberta. Campos e exemplos ficaram mais claros. |
| Temas e marca | Símbolo, botões principais e opções selecionadas mantêm o azul royal `#1748F5` nos dois temas. No escuro, uma base clara preserva a leitura do símbolo. Textos e ícones de apoio continuam com contraste adaptado. |
| Navegação | Telas fora das abas têm o botão identificado “Início”. Após publicar ou salvar alterações, a gestão confirma o sucesso; a seta também permite sair para o início sem reabrir a revisão. |
| Rascunho | Voltar da lista de necessidades para a história preserva os pedidos adicionados. O editor de necessidade retorna à lista correta. |
| Publicação e edição | “Publicar campanha” distingue a primeira publicação de “Salvar alterações”. As etapas intermediárias identificam quando a campanha está sendo editada. A gestão oferece acesso à página pública. |
| Valores e prioridades | A gestão mostra dinheiro em reais e distingue unidades de vagas. A quantidade `1.000` é salva como mil, usando a mesma interpretação da validação. O detalhe da necessidade identifica “PRIORIDADE NORMAL/ALTA”. |
| Confirmação de ajudas | Sem pendências, há uma explicação em vez de pedir uma seleção impossível. Ao escolher outra ajuda, as opções de confirmação voltam aos valores iniciais. |
| Doação de teste | Valores sugeridos e formas de pagamento receberam rótulos explícitos, mantendo a indicação de simulação. |

**Verificação:** TypeScript, lint, compilação web e os 8 testes de backend passaram. No Chromium com API/MySQL reais em banco temporário isolado, foram validados criação em quatro etapas, publicação, valores persistidos, retorno ao início, preservação do rascunho e tema escuro após recarregar. Foram conferidas as 35 rotas em 320 px nos dois temas e 6 telas em 1280 px nos dois temas: 82 verificações, sem transbordamento horizontal ou erros JavaScript. O banco temporário foi removido; os dados de desenvolvimento foram preservados. Não houve teste em aparelho Android/iOS.

**Shared Brain:** após o usuário informar o destino pessoal, a base `ibasgal/obsidian-chatgpt`, pasta `shared-brain/`, foi consultada e atualizada. Dossiê, decisões, evidências e uma cópia recuperável do patch foram publicados na `main`, commit `3a872a0a649a2a9346c860f3009a9af47fd706d6`, com leitura remota e integridade da fonte conferidas. [Registro do SOMA](https://github.com/ibasgal/obsidian-chatgpt/blob/main/shared-brain/02%20-%20Projects/SOMA/Current%20State.md). A consulta à memória ocorreu depois da implementação, quando o acesso foi esclarecido. O estado de entrega e o commit do código estão nesse registro do SOMA.
