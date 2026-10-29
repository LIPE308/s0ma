-- Abra no Workbench conectado ao mesmo servidor configurado no aplicativo.
-- Instalação local atual: host 127.0.0.1, porta 3307, usuário soma, schema soma.
-- A senha está somente em backend/.env. Este roteiro apenas consulta dados.
USE soma;
SELECT DATABASE() AS banco, VERSION() AS versao_mysql;
SELECT estado,COUNT(*) AS campanhas FROM campanhas GROUP BY estado;
SELECT c.id,c.titulo,u.nome AS responsavel,c.estado FROM campanhas c JOIN usuarios u ON u.id=c.usuario_id ORDER BY c.criada_em DESC;
SELECT c.titulo,u.estado,u.classe,u.pontos,u.prazo_limite,u.revisado_por,u.revisada_em FROM urgencias u JOIN campanhas c ON c.id=u.campanha_id ORDER BY u.revisada_em DESC;
SELECT id,referencia,bruto,tributos,custos,estado,modo FROM receitas_publicitarias ORDER BY id DESC;
SELECT d.id,c.titulo,d.receita_id,d.valor,d.criada_em FROM distribuicoes d JOIN campanhas c ON c.id=d.campanha_id ORDER BY d.id DESC;
SELECT estado,COUNT(*) AS mensagens FROM email_entregas GROUP BY estado;
SELECT id,evento,estado,tentativas,erro_codigo,criada_em,enviada_em FROM email_entregas ORDER BY id DESC;
SELECT id,usuario_id,mensagem,lido,criado_em,destino FROM avisos ORDER BY id DESC;
SELECT provedor,conta,inicio,fim,moeda,estimado_centavos,impressoes,consultado_em FROM relatorios_anuncios ORDER BY consultado_em DESC;
SELECT id,acao,usuario_id,campanha_id,criado_em FROM auditoria ORDER BY id DESC LIMIT 100;
