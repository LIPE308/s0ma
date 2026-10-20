# Roteiro de demonstração do SOMA

Use dados fictícios identificados como teste, sem documentos, endereço residencial ou contato de beneficiários. As campanhas ilustrativas de um banco vazio não representam entregas reais.

1. Execute os comandos do README. Abra http://localhost:3001. Confira GET /api/saude. Não apague dados para preparar a apresentação.
2. Sem entrar, explore campanhas e necessidades. Abra uma campanha; instruções privadas e telefone não devem aparecer.
3. Cadastre duas contas próprias, uma organizadora e uma doadora. Na organizadora, preencha seu telefone no perfil se desejar demonstrar contato. Não use telefone de outra pessoa.
4. Crie uma campanha: história, cidade/bairro, prazo válido. Acrescente, por exemplo, livros (10 unidades), cobertores (5 unidades), tarefa (2 vagas) e dinheiro (R$ 100,00 simulado). Pode publicar apenas um tipo; pedidos do mesmo tipo têm metas separadas. Não é necessário documento do beneficiário.
5. Entre como doador. Escolha livros, registre intenção de 3 unidades e confirme que leu as instruções. A ajuda deve aparecer reservada, com 0 recebido. O contato e as orientações privadas aparecem nesta ajuda; a entrega é combinada fora do aplicativo. Não é necessário abrir WhatsApp nem ligar durante a apresentação.
6. Como organizador, entre em Gerenciar > Ajudas > Confirmar. Informe o total acumulado de 2 recebidos, mantendo 1 pendente. O progresso dos livros deve ficar 2/10; os outros pedidos não mudam. Repetir a confirmação de 2 não deve somar mais 2.
7. Como doador, escolha o pedido de dinheiro, informe R$ 20,00 e crie o pagamento de teste. Só depois de confirmar o teste o progresso muda para R$ 20,00. Não há cobrança ou taxa nova. Não apresente saldo como dinheiro disponível no mundo real.
8. Como organizador, encerre a campanha mesmo sem completar as metas. Seu histórico continua visível; uma tentativa nova de ajuda é recusada.
9. Para reabrir, escolha Revisar metas e reabrir, atualize uma meta (por exemplo livros para 12), mantenha as demais necessidades e informe um motivo na revisão. O recebido permanece 2.
10. Cadastre uma terceira conta para administração. O operador local executa `npm run admin:configurar -- email-da-conta`. A conta deve entrar novamente, sendo encaminhada à administração. Contas comuns não recebem esse acesso.
11. Faça uma denúncia de teste como doador. A denúncia não oculta automaticamente a campanha. Como administrador, analise a campanha e registre motivo ao suspender/pedir ajustes. Visitantes deixam de acessar os detalhes. Marque o relato como analisado; ele permanece no histórico administrativo, sem revelar o autor publicamente.
12. Se publicar novamente uma campanha encerrada, ela continua encerrada. Só a revisão de metas e o motivo autorizam a reabertura pelo responsável.

O registro de recebimento é uma declaração do responsável. O roteiro demonstra consistência e autorização, sem comprovar entrega, legitimidade ou impacto social. Consulte [limites do produto](LIMITES-DO-PRODUTO.md) e [resultados de validação](AUDITORIA-ENTREGA.md).
