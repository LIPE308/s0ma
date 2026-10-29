const nodemailer = require('nodemailer');

function configuracaoEmail(env = process.env) {
  const porta = Number(env.SMTP_PORTA || 465);
  const pronto = Boolean(env.SMTP_HOST && env.SMTP_USUARIO && env.SMTP_SENHA && env.EMAIL_REMETENTE);
  return { pronto, porta, remetente: env.EMAIL_REMETENTE || '', host: env.SMTP_HOST || '' };
}
function criarTransporte(env = process.env) {
  if (!configuracaoEmail(env).pronto) return null;
  const porta = Number(env.SMTP_PORTA || 465);
  return nodemailer.createTransport({ host: env.SMTP_HOST, port: porta, secure: porta === 465,
    requireTLS: porta !== 465, auth: { user: env.SMTP_USUARIO, pass: env.SMTP_SENHA },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, tls: { minVersion: 'TLSv1.2' },
    disableFileAccess: true, disableUrlAccess: true });
}
async function notificarUrgencia(q, campanha, decisao, historicoId) {
  const [pessoa] = await q('SELECT nome,email FROM usuarios WHERE id=?', [campanha.usuario_id]);
  const aprovada = decisao.classe !== 'regular';
  const classe = { critica: 'crítica', moderada: 'moderada', regular: 'regular' }[decisao.classe];
  const resumo = aprovada ? `Urgência ${classe} aprovada para “${campanha.titulo}”.` : `A solicitação de urgência de “${campanha.titulo}” foi analisada e permanece regular.`;
  const destino = '/urgencia?id=' + encodeURIComponent(campanha.id);
  await q('INSERT INTO avisos (usuario_id,mensagem,destino) VALUES (?,?,?)', [campanha.usuario_id, resumo, destino]);
  const origem = process.env.APP_URL || 'http://localhost:3001';
  const link = new URL(destino, origem).href;
  const mensagem = `Olá, ${pessoa.nome}.\n\n${resumo}\n\nConfira a decisão e sua justificativa no SOMA: ${link}\n\nA aprovação de urgência não garante recebimento de recursos.\n\nEquipe SOMA`;
  // A notificação e a saída de e-mail são confirmadas junto com a decisão.
  // Não inclui documentos nem informações pessoais da solicitação no e-mail.
  await q('INSERT INTO email_entregas (evento,usuario_id,campanha_id,destinatario,assunto,texto) VALUES (?,?,?,?,?,?)',
    ['urgencia:' + historicoId, campanha.usuario_id, campanha.id, pessoa.email, 'SOMA: resultado da sua solicitação de urgência', mensagem]);
}
async function processarEmails({ consultar, transacao, enviar, agora = Date.now(), limite = 10 }) {
  let enviados = 0;
  for (let i = 0; i < limite; i++) {
    const registro = await transacao(async q => {
      const [item] = await q("SELECT * FROM email_entregas WHERE ((estado IN ('pendente','falhou') AND proxima_em<=? AND tentativas<6) OR (estado='enviando' AND bloqueada_em<?)) ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED", [agora, agora - 300000]);
      if (!item) return null;
      await q("UPDATE email_entregas SET estado='enviando',bloqueada_em=?,tentativas=tentativas+1 WHERE id=?", [agora, item.id]);
      return item;
    });
    if (!registro) break;
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registro.destinatario) || /@(exemplo\.com|example\.(com|org|net))$/i.test(registro.destinatario)) {
        const e = new Error('destinatario_de_exemplo'); e.code = 'DESTINATARIO_EXEMPLO'; e.definitivo = true; throw e;
      }
      const resultado = await enviar(registro);
      await consultar("UPDATE email_entregas SET estado='enviado',enviada_em=CURRENT_TIMESTAMP,bloqueada_em=NULL,erro_codigo='',mensagem_id=? WHERE id=?", [String(resultado?.messageId || '').slice(0,200), registro.id]);
      enviados++;
    } catch (e) {
      // Nunca persiste tokens, credenciais ou a resposta bruta do provedor.
      const codigo = /^[A-Z0-9_]{1,60}$/.test(e.code || '') ? e.code : 'ENVIO_FALHOU';
      await consultar("UPDATE email_entregas SET estado='falhou',bloqueada_em=NULL,erro_codigo=?,proxima_em=?,tentativas=CASE WHEN ? THEN 6 ELSE tentativas END WHERE id=?", [codigo, agora + Math.min(3600000, 60000 * 2 ** registro.tentativas), !!e.definitivo, registro.id]);
    }
  }
  return enviados;
}
function iniciarFilaEmail({ consultar, transacao }) {
  if (process.env.EMAIL_WORKER_DESATIVADO === '1') return () => {};
  const transporte = criarTransporte();
  if (!transporte) return () => {};
  let ocupado = false, parado = false;
  const executar = async () => {
    if (ocupado || parado) return;
    ocupado = true;
    try { await processarEmails({ consultar, transacao, enviar: r => transporte.sendMail({ from: process.env.EMAIL_REMETENTE, to: r.destinatario, subject: r.assunto, text: r.texto, messageId: `<soma-${r.id}-${Buffer.from(r.evento).toString('hex')}@${process.env.EMAIL_DOMINIO_ID || 'soma.local'}>`, headers: { 'X-SOMA-Event': r.evento } }) }); }
    catch { console.error('Fila de e-mail indisponível; os registros permanecem no MySQL.'); }
    finally { ocupado = false; }
  };
  const timer = setInterval(executar, 15000); timer.unref(); void executar();
  return async () => { parado = true; clearInterval(timer); while (ocupado) await new Promise(r => setTimeout(r, 50)); transporte.close(); };
}
module.exports = { configuracaoEmail, criarTransporte, notificarUrgencia, processarEmails, iniciarFilaEmail };
