# Administração em /soma/admin

Publicado em `https://korvy.com.br/soma/admin`, reaproveitando o painel de campanhas, urgências, publicidade, receita, distribuição, denúncias, repasses, doações, e-mails, integrações e auditoria. Nenhuma página institucional da Korvy foi modificada.

O acesso inicial pede a senha da conta administrativa dedicada. A conta é provisionada explicitamente por `npm run admin:local -- admin@exemplo.com`. A senha aleatória fica em `backend/.admin-local.json`, ignorado pelo Git; no banco há somente sal e resumo scrypt. A senha não está no frontend, URL ou documentação. O backend limita tentativas dessa conta a oito por minuto e usa sessão HttpOnly/Secure no caminho `/soma/api`. Todas as APIs administrativas verificam o papel do usuário no servidor. Conhecer o endereço não concede acesso.

Pessoas: lista paginada de todos os cadastros, busca por nome/e-mail/cidade, contato, localização informada, quantidade de campanhas, vínculo Google e situação de acesso. `Abrir cadastro e campanhas` mostra campanhas e contadores de ajudas/doações. O cadastro é somente leitura: nome, e-mail, telefone, cidade e histórico. A API administrativa bloqueia criação, edição e exclusão de cadastros. Bloqueio/liberação usa o fluxo auditado existente.

Cadastros com campanhas, ajudas, pagamentos ou outros vínculos não são apagados: a API retorna conflito e orienta bloquear o acesso. Exclusão e atualização são transacionais, com auditoria; falhas de integridade desfazem toda a operação. Senhas e hashes nunca são devolvidos nas consultas. Localização vem do cadastro, sem rastreamento.

Verificação: 53 testes do backend/MySQL, incluindo CRUD administrativo, proteção de privilégio e cadastro comum sem elevação; um teste de limite de tentativas; tipos, lint e duas exportações web. No endereço público, acesso anônimo à lista retornou 401; login e restauração de sessão retornaram 200; lista trouxe 12 usuários com cidade e quantidade de campanhas. Navegador conferiu senha → Pessoas → cadastro e histórico. A sessão administrativa de teste foi encerrada e o navegador ficou na tela de senha. Nenhum cadastro real foi apagado para teste.

A publicação continua temporária e depende do PC, MySQL e túnel ligados, conforme `deploy/korvy/README.md`. As receitas e pagamentos mantêm o modo simulado existente; esse painel não transforma projeções em dinheiro real.

Atualização de 12/11/2026: cadastros administrativos são somente consulta, com bloqueio de escrita na API. Fotos de avatar/capa são vinculadas ao perfil na transação de upload; o cabeçalho é atualizado após alterações. Verificação: 55 testes MySQL e inspeção web de cadastro sem campos editáveis.
