const { erro, texto, inteiro } = require('./auxiliares');
const { configuracaoEmail, criarTransporte } = require('./notificacoes');
const { configuracaoPublicidade, importarRelatorio } = require('./publicidade');
const { auditar } = require('./soma2');
const { umaVez } = require('./operacoes');

const listas = {
  campanhas: { from: 'campanhas c JOIN usuarios u ON u.id=c.usuario_id LEFT JOIN campanhas_detalhes cd ON cd.campanha_id=c.id', select: 'c.id,c.titulo,c.estado,c.categoria,c.criada_em,c.usuario_id,u.nome AS responsavel,u.email,COALESCE(cd.submetida,0) AS submetida,(SELECT COALESCE(SUM(meta),0) FROM necessidades WHERE campanha_id=c.id AND tipo=\'dinheiro\') AS meta,(SELECT COALESCE(SUM(recebido),0) FROM necessidades WHERE campanha_id=c.id AND tipo=\'dinheiro\') AS recebido', search: ['c.titulo','u.nome','u.email'], state: 'c.estado', order: 'c.criada_em DESC,c.id' },
  urgencias: { from: 'urgencias a JOIN campanhas c ON c.id=a.campanha_id JOIN usuarios u ON u.id=c.usuario_id', select: 'a.campanha_id AS id,a.*,c.titulo,c.estado AS campanha_estado,u.nome AS responsavel', search: ['c.titulo','u.nome'], state: 'a.estado', order: "(a.estado IN ('pendente','recurso')) DESC,a.prazo_limite,a.campanha_id" },
  usuarios: { from: 'usuarios a', select: 'a.id,a.nome,a.email,a.administrador,a.bloqueado,(SELECT COUNT(*) FROM campanhas c WHERE c.usuario_id=a.id) AS campanhas,(SELECT COUNT(*) FROM identidades i WHERE i.usuario_id=a.id AND i.provedor=\'google\') AS google', search: ['a.nome','a.email'], state: null, order: 'a.id DESC' },
  emails: { from: 'email_entregas a JOIN campanhas c ON c.id=a.campanha_id', select: 'a.id,a.evento,a.destinatario,a.assunto,a.estado,a.tentativas,a.criada_em,a.enviada_em,a.erro_codigo,a.campanha_id,c.titulo', search: ['a.destinatario','c.titulo'], state: 'a.estado', order: 'a.id DESC' },
  auditoria: { from: 'auditoria a LEFT JOIN usuarios u ON u.id=a.usuario_id LEFT JOIN campanhas c ON c.id=a.campanha_id', select: 'a.id,a.acao,a.dados,a.criado_em,a.campanha_id,u.nome AS operador,c.titulo', search: ['a.acao','u.nome','c.titulo'], state: null, order: 'a.id DESC' },
  distribuicoes: { from: 'distribuicoes a JOIN campanhas c ON c.id=a.campanha_id JOIN receitas_publicitarias r ON r.id=a.receita_id', select: 'a.id,a.campanha_id,a.valor,a.receita_id,a.criada_em,a.criterios,c.titulo,r.referencia,r.modo', search: ['c.titulo','r.referencia'], state: null, order: 'a.id DESC' },
  receitas: { from: 'receitas_publicitarias a', select: 'a.*,(SELECT COALESCE(SUM(valor),0) FROM distribuicoes WHERE receita_id=a.id) AS distribuido', search: ['a.referencia','a.justificativa'], state: 'a.estado', order: 'a.id DESC' },
  denuncias: { from: 'denuncias a JOIN campanhas c ON c.id=a.campanha_id', select: 'a.id,a.campanha_id,a.motivo,a.relato,a.estado,c.titulo', search: ['c.titulo','a.motivo'], state: 'a.estado', order: "(a.estado='pendente') DESC,a.id DESC" },
  repasses: { from: 'repasses a JOIN campanhas c ON c.id=a.campanha_id', select: 'a.id,a.campanha_id,a.valor,a.estado,a.finalidade,a.motivo,c.titulo', search: ['c.titulo','a.finalidade'], state: 'a.estado', order: "(a.estado='solicitado') DESC,a.id DESC" },
  pagamentos: { from: 'pagamentos a JOIN necessidades n ON n.id=a.necessidade_id JOIN campanhas c ON c.id=n.campanha_id JOIN usuarios u ON u.id=a.usuario_id', select: 'a.id,a.valor,a.valor_liquido,a.estado,a.meio,c.titulo,u.nome AS pessoa', search: ['c.titulo','u.nome'], state: 'a.estado', order: 'a.id DESC' },
  relatorios: { from: 'relatorios_anuncios a', select: 'a.id,a.provedor,a.conta,a.inicio,a.fim,a.moeda,a.estimado_centavos,a.impressoes,a.consultado_em', search: ['a.provedor','a.conta'], state: null, order: 'a.consultado_em DESC,a.id DESC' },
};

async function atenderAdministracao(ctx) {
  const { caminho, metodo, usuario, dados, consultar, transacao, exigirAdministrador, requisicao } = ctx;
  if (!caminho.startsWith('/api/administracao/painel')) return null;
  exigirAdministrador(usuario);
  const ok = resultado => ({ resultado });
  const params = new URL(requisicao.url,'http://localhost').searchParams;
  if (caminho === '/api/administracao/painel' && metodo === 'GET') {
    const [campanhas, pessoas, urgencias, receitas, distribuicoes, operacoes, emails, fila, publicacoes] = await Promise.all([
      consultar('SELECT estado,COUNT(*) AS total FROM campanhas GROUP BY estado'),
      consultar('SELECT COUNT(*) AS total,COALESCE(SUM(bloqueado),0) AS bloqueados FROM usuarios'),
      consultar("SELECT COUNT(*) AS total FROM urgencias WHERE estado IN ('pendente','recurso')"),
      consultar("SELECT COALESCE(SUM(bruto),0) AS bruto,COALESCE(SUM(tributos+custos),0) AS custos,COALESCE(SUM(bruto-tributos-custos),0) AS liquido,COALESCE(SUM(FLOOR((bruto-tributos-custos)*70/100)),0) AS fundo FROM receitas_publicitarias WHERE estado IN ('confirmada','distribuida')"),
      consultar('SELECT COALESCE(SUM(valor),0) AS total FROM distribuicoes'),
      consultar("SELECT (SELECT COUNT(*) FROM denuncias WHERE estado='pendente') AS denuncias,(SELECT COUNT(*) FROM repasses WHERE estado='solicitado') AS repasses"),
      consultar('SELECT estado,COUNT(*) AS total FROM email_entregas GROUP BY estado'),
      consultar("SELECT u.campanha_id AS id,c.titulo,u.estado,u.prazo_limite,u.recomendacao FROM urgencias u JOIN campanhas c ON c.id=u.campanha_id WHERE u.estado IN ('pendente','recurso') ORDER BY u.prazo_limite LIMIT 6"),
      consultar("SELECT c.id,c.titulo,c.estado FROM campanhas c JOIN campanhas_detalhes d ON d.campanha_id=c.id WHERE c.estado IN ('rascunho','ajustes') AND d.submetida=1 ORDER BY c.criada_em LIMIT 6"),
    ]);
    return ok({ atualizado_em: new Date().toISOString(), campanhas, pessoas: pessoas[0], urgencias_pendentes: urgencias[0].total,
      financeiro: { ...receitas[0], distribuido: distribuicoes[0].total, retido: Number(receitas[0].fundo)-Number(distribuicoes[0].total), operacao: Number(receitas[0].liquido)-Number(receitas[0].fundo), modo: 'simulado' },
      operacoes: operacoes[0], emails, fila_urgencias: fila, fila_campanhas: publicacoes });
  }
  if (caminho === '/api/administracao/painel/lista' && metodo === 'GET') {
    const spec = listas[params.get('tipo')];
    if (!spec) erro('Lista administrativa inválida.');
    const pagina = inteiro(Number(params.get('pagina') || 1), 'a página', 1, 100000), limite = 20;
    const busca = texto(params.get('busca') || '', 'a busca', 150, false), estado = texto(params.get('estado') || '', 'o estado', 40, false);
    const filtros = [], valores = [];
    if (busca) { filtros.push('(' + spec.search.map(c => c+' LIKE ?').join(' OR ') + ')'); valores.push(...spec.search.map(() => '%'+busca+'%')); }
    if (estado && spec.state) { filtros.push(spec.state+'=?'); valores.push(estado); }
    const where = filtros.length ? ' WHERE '+filtros.join(' AND ') : '';
    const [[contagem], itens] = await Promise.all([consultar('SELECT COUNT(*) AS total FROM '+spec.from+where,valores), consultar('SELECT '+spec.select+' FROM '+spec.from+where+' ORDER BY '+spec.order+' LIMIT '+limite+' OFFSET '+((pagina-1)*limite),valores)]);
    return ok({ itens, pagina, total: Number(contagem.total), paginas: Math.max(1,Math.ceil(contagem.total/limite)) });
  }
  if (caminho === '/api/administracao/painel/integracoes' && metodo === 'GET') {
    const [db] = await consultar('SELECT DATABASE() AS nome,VERSION() AS versao');
    const email = configuracaoEmail();
    const postgres = process.env.BANCO_TIPO === 'postgres' || Boolean(process.env.DATABASE_URL);
    const conexao = postgres ? new URL(process.env.DATABASE_URL) : null;
    return ok({ banco: { conectado: true, nome: db.nome, versao: db.versao, tipo: postgres ? 'Supabase/PostgreSQL' : 'MySQL', host: conexao?.hostname || process.env.MYSQL_HOST || '127.0.0.1', porta: Number(postgres ? conexao.port || 5432 : process.env.MYSQL_PORTA || 3306), usuario: conexao ? decodeURIComponent(conexao.username) : process.env.MYSQL_USUARIO || 'soma' },
      google: { configurado: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI), retorno: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback' },
      email: { configurado: email.pronto, remetente: email.remetente, host: email.host, porta: email.porta }, publicidade: configuracaoPublicidade(),
      financeiro: { modo: 'simulado', pagamentos_reais: false }, notificacoes: { aplicativo: true, push: false } });
  }
  if (caminho === '/api/administracao/painel/email/verificar' && metodo === 'POST') {
    const transporte = criarTransporte();
    if (!transporte) erro('Configure SMTP_HOST, SMTP_PORTA, SMTP_USUARIO, SMTP_SENHA e EMAIL_REMETENTE no servidor.',409);
    try { await transporte.verify(); return ok({ mensagem: 'Conexão SMTP autenticada. A entrega depende da aceitação de cada mensagem pelo provedor.' }); }
    catch { erro('O SMTP não autenticou. Confira a conexão e as credenciais locais.',502); }
    finally { transporte.close(); }
  }
  let partes;
  if ((partes = caminho.match(/^\/api\/administracao\/painel\/emails\/(\d+)\/repetir$/)) && metodo === 'POST') {
    return ok(await transacao(async q => {
      const [item] = await q('SELECT id,estado FROM email_entregas WHERE id=? FOR UPDATE',[partes[1]]);
      if (!item) erro('Entrega não encontrada.',404);
      if (item.estado !== 'falhou') erro('Somente e-mails que falharam podem ser reenviados.',409);
      await q("UPDATE email_entregas SET estado='pendente',tentativas=0,proxima_em=0,erro_codigo='' WHERE id=?",[item.id]);
      await auditar(q,usuario.id,null,'email_reenfileirado',{ id:item.id }); return { mensagem:'E-mail recolocado na fila. O envio requer SMTP configurado.' };
    }));
  }
  if ((partes = caminho.match(/^\/api\/administracao\/painel\/usuarios\/(\d+)$/)) && metodo === 'PATCH') {
    return ok(await transacao(async q => {
      const [p] = await q('SELECT id,administrador,bloqueado FROM usuarios WHERE id=? FOR UPDATE',[partes[1]]);
      if (!p) erro('Usuário não encontrado.',404);
      if (p.id === usuario.id || p.administrador) erro('A gestão de administradores exige o operador local.',403);
      if (typeof dados.bloqueado !== 'boolean') erro('Informe a situação de acesso.');
      const motivo = texto(dados.motivo,'o motivo',1000);
      await q('UPDATE usuarios SET bloqueado=? WHERE id=?',[Number(dados.bloqueado),p.id]);
      if (dados.bloqueado) await q('DELETE FROM sessoes WHERE usuario_id=?',[p.id]);
      await auditar(q,usuario.id,null,dados.bloqueado?'usuario_bloqueado':'usuario_liberado',{ usuario_id:p.id,motivo });
      return { mensagem:'Situação de acesso atualizada.' };
    }));
  }
  if (caminho === '/api/administracao/painel/anuncios/importar' && metodo === 'POST') {
    const relatorio = await importarRelatorio(dados);
    return ok(await transacao(async q => umaVez(q,usuario.id,requisicao,dados,async()=>{
      await q('INSERT INTO relatorios_anuncios (provedor,conta,inicio,fim,moeda,estimado_centavos,impressoes,usuario_id) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE estimado_centavos=VALUES(estimado_centavos),impressoes=VALUES(impressoes),consultado_em=CURRENT_TIMESTAMP,usuario_id=VALUES(usuario_id)',[relatorio.provedor,relatorio.conta,relatorio.inicio,relatorio.fim,relatorio.moeda,relatorio.estimado_centavos,relatorio.impressoes,usuario.id]);
      await auditar(q,usuario.id,null,'relatorio_publicitario_consultado',{ provedor:relatorio.provedor,inicio:relatorio.inicio,fim:relatorio.fim });
      return { mensagem:'Relatório estimado importado. Nenhum saldo ou distribuição foi alterado.',relatorio };
    })));
  }
  erro('Operação administrativa não encontrada.',404);
}
module.exports = { atenderAdministracao };
