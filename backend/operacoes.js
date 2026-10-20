const { createHash } = require('node:crypto');
const { erro } = require('./auxiliares');

// Called inside the business transaction: both the operation and its receipt roll back together.
async function umaVez(consulta, usuarioId, requisicao, dados, executar) {
  const chave = requisicao.headers['idempotency-key'];
  if (chave === undefined) return executar(); // Compatibility with existing API clients.
  if (typeof chave !== 'string' || !/^[a-zA-Z0-9_-]{12,100}$/.test(chave)) erro('Identificador de envio inválido.');
  const resumo = createHash('sha256').update(requisicao.method + requisicao.url.split('?')[0] + JSON.stringify(dados)).digest('hex');
  await consulta('INSERT INTO operacoes (usuario_id,chave,resumo) VALUES (?,?,?) ON DUPLICATE KEY UPDATE chave=chave', [usuarioId, chave, resumo]);
  const [registro] = await consulta('SELECT resumo,resposta FROM operacoes WHERE usuario_id=? AND chave=? FOR UPDATE', [usuarioId, chave]);
  if (registro.resumo !== resumo) erro('Este envio já foi usado com outros dados. Revise o formulário antes de continuar.', 409);
  if (registro.resposta !== null) return JSON.parse(registro.resposta);
  const resposta = await executar();
  await consulta('UPDATE operacoes SET resposta=? WHERE usuario_id=? AND chave=?', [JSON.stringify(resposta), usuarioId, chave]);
  return resposta;
}
module.exports = { umaVez };
