const DIA = 86400000;
const naturezas = { vida: 30, moradia: 20, alimentacao: 20, educacao: 10, outros: 0 };
const hojeUTC = (agora = new Date()) => new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
function dataISO(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(valor + 'T00:00:00.000Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === valor ? valor : null;
}
function diasAte(valor, agora = new Date()) {
  const iso = dataISO(valor);
  return iso ? Math.ceil((new Date(iso + 'T00:00:00Z').getTime() - hojeUTC(agora).getTime()) / DIA) : null;
}
function avaliarUrgencia(dados, meta, recebido, agora = new Date()) {
  const dias = diasAte(dados.prazo_limite, agora);
  const recursos = Math.max(0, Number(dados.recursos_disponiveis) || 0);
  const fracao = meta > 0 ? Math.max(0, (meta - recebido - recursos) / meta) : 0;
  const validade = diasAte(dados.evidencia_valida_ate, agora);
  const evidencias = Boolean(dados.evidencia_verificada) && validade !== null && validade >= 0;
  const criterios = {
    natureza: naturezas[dados.natureza] || 0,
    prazo: dias === null || dias < 0 ? 0 : dias <= 2 ? 25 : dias <= 7 ? 20 : dias <= 30 ? 10 : 0,
    consequencias: String(dados.consequencias || '').trim().length >= 30 ? 10 : 0,
    evidencias: evidencias ? 20 : 0,
    lacuna: fracao >= .75 ? 15 : fracao >= .25 ? 8 : 0,
  };
  const pontos = Object.values(criterios).reduce((a, b) => a + b, 0);
  const recomendacao = dias === null || dias < 0 ? 'regular' : pontos >= 70 ? 'critica' : pontos >= 40 ? 'moderada' : 'regular';
  return { pontos, recomendacao, criterios, dias, evidencias, versao: 'urgencia-1' };
}
function urgenciaPublica(dados, agora = new Date()) {
  if (!dados) return { classe: 'regular', revisada: false, recomendacao_automatica: false };
  const dias = diasAte(dados.prazo_limite, agora);
  const validade = diasAte(dados.evidencia_valida_ate, agora);
  const revisada = dados.estado === 'revisada' && Boolean(dados.revisado_por) && validade !== null && validade >= 0 && dias !== null && dias >= 0 && Boolean(dados.evidencia_verificada);
  return { classe: revisada ? dados.classe : 'regular', revisada, validade: revisada ? dataISO(dados.evidencia_valida_ate) : null, prazo: revisada ? dataISO(dados.prazo_limite) : null, recomendacao_automatica: false };
}
module.exports = { avaliarUrgencia, urgenciaPublica, dataISO, diasAte, hojeUTC, naturezas };
