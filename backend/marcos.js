async function registrarMarcos(campanhaId, consulta) {
  const [apoio] = await consulta("SELECT (EXISTS(SELECT 1 FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id WHERE n.campanha_id=? AND p.estado='confirmado') OR EXISTS(SELECT 1 FROM ajudas WHERE campanha_id=? AND recebido>0)) AS existe", [campanhaId, campanhaId]);
  if (Number(apoio.existe)) await consulta("INSERT IGNORE INTO marcos_financeiros (campanha_id,chave) VALUES (?,'apoiadores:1')", [campanhaId]);
  const [s] = await consulta("SELECT COALESCE(SUM(meta),0) AS meta,COALESCE(SUM(recebido),0) AS total FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'", [campanhaId]);
  const [a] = await consulta('SELECT COALESCE(SUM(valor),0) AS total FROM distribuicoes_solidarias WHERE campanha_id=?', [campanhaId]);
  const meta = Number(s.meta), total = Number(s.total) + Number(a.total);
  if (!meta) return;
  const valores = [0, Math.min(20000, meta), meta * .25, meta * .5, meta * .75, meta].map(Math.round);
  for (let i = 1; i < valores.length; i++) if (total >= valores[i]) await consulta('INSERT IGNORE INTO marcos_financeiros (campanha_id,chave) VALUES (?,?)', [campanhaId, `financeiro-${i}:${valores[i]}`]);
}
module.exports = { registrarMarcos };
