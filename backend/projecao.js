const { diasAte } = require('./urgencia');
const DIA = 86400000;
function estimarCadencia(registros, agora = new Date(), minimo = 3) {
  const limite = agora.getTime() - 30 * DIA;
  const validos = registros.filter(r => Number(r.valor) > 0 && new Date(r.criado_em).getTime() >= limite && new Date(r.criado_em).getTime() <= agora.getTime());
  const diasDistintos = new Set(validos.map(r => new Date(r.criado_em).toISOString().slice(0, 10)));
  if (validos.length < minimo || diasDistintos.size < minimo) return null;
  const primeiro = Math.min(...validos.map(r => new Date(r.criado_em).getTime()));
  const dias = (agora.getTime() - primeiro) / DIA;
  if (dias < 7) return null;
  const mediaDiaria = validos.reduce((s, r) => s + Number(r.valor), 0) / dias;
  return { mensal: Math.floor(mediaDiaria * 30), media_diaria: mediaDiaria, amostras: validos.length, dias: Math.floor(dias), hipotese: 'Mantida a média de registros confirmados dos últimos 30 dias. Novas contribuições não são garantidas.' };
}
function criarProjecao({ doacoes, anuncios, restante, urgencia, disponivel, estado = 'ativa' }, opcoes = {}, agora = new Date()) {
  const ativa = estado === 'ativa';
  const ritmo = ativa ? estimarCadencia(doacoes, agora) : null;
  const publicidade = ativa ? estimarCadencia(anuncios, agora, 2) : null;
  const diasUso = urgencia?.prazo ? diasAte(urgencia.prazo, agora) : null;
  const preservar = urgencia?.classe === 'critica' || (diasUso !== null && diasUso <= 7);
  let educativa = null;
  if (opcoes.taxa_mensal !== undefined && opcoes.taxa_mensal !== '') {
    const taxa = Number(opcoes.taxa_mensal), dias = Number(opcoes.dias), custos = Number(opcoes.custos);
    if (!Number.isFinite(taxa) || taxa < 0 || taxa > 2 || !Number.isInteger(dias) || dias < 1 || dias > 365 || !Number.isSafeInteger(custos) || custos < 0) throw new Error('Informe taxa hipotética de 0 a 2% ao mês, prazo de 1 a 365 dias e custos em centavos.');
    educativa = preservar ? { bloqueada: true, motivo: 'A prioridade desta campanha é disponibilidade imediata e preservação do valor.' } : { bloqueada: false, capital: Math.max(0, disponivel), taxa_mensal: taxa, dias, custos, resultado: Math.max(0, Math.floor(Math.max(0, disponivel) * (Math.pow(1 + taxa / 100, dias / 30) - 1)) - custos), hipotese: 'Exercício com taxa e custos informados por você; sem produto indicado, aplicação, garantia de rendimento ou dinheiro real.' };
  }
  const diasMeta = restante <= 0 ? 0 : ritmo?.media_diaria > 0 ? Math.ceil(restante / ritmo.media_diaria) : null;
  return { doacoes: ritmo, anuncios: publicidade, rendimento_estimado: educativa && !educativa.bloqueada ? educativa.resultado : null, dias_para_meta: diasMeta, mensagem: !ativa ? 'Campanha fora de arrecadação ativa: projeções de novas contribuições estão suspensas.' : ritmo ? 'Projeção baseada no histórico simulado; não é promessa.' : 'Estimativa ainda indisponível', estrategia: preservar ? 'Priorizar liquidez imediata e preservação dos recursos.' : 'Planejar o prazo de uso e ampliar a divulgação; qualquer alternativa financeira exige avaliar liquidez, custos e riscos.', alerta_prazo: diasMeta !== null && diasUso !== null && diasMeta > diasUso ? 'O ritmo histórico não alcançaria a meta dentro do prazo declarado. Priorize apoio imediato e revisão do plano.' : null, educativa };
}
module.exports = { estimarCadencia, criarProjecao };
