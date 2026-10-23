const { erro, inteiro } = require('./auxiliares');

function dataPrazo(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || '');
  if (!partes) return null;
  const [, d, m, a] = partes.map(Number);
  const data = new Date(Date.UTC(a, m - 1, d, 23, 59, 59));
  return data.getUTCDate() === d && data.getUTCMonth() === m - 1 ? data : null;
}

// Somente um revisor fornece os critérios comprovados. O autor envia um relato.
function classificarUrgencia(criterios, prazo, agora = new Date()) {
  const gravidade = inteiro(criterios.gravidade, 'gravidade', 0, 3);
  const impacto = inteiro(criterios.impacto, 'impacto', 0, 3);
  if (typeof criterios.documentos !== 'boolean' || typeof criterios.consistente !== 'boolean') erro('Confirme a revisão das evidências e da consistência.');
  const data = dataPrazo(prazo);
  const dias = data ? Math.ceil((data - agora) / 86400000) : null;
  const pontosPrazo = dias !== null && dias >= 0 ? dias <= 7 ? 20 : dias <= 30 ? 10 : 0 : 0;
  const pontos = gravidade * 10 + impacto * 10 + pontosPrazo + (criterios.documentos ? 10 : 0) + (criterios.consistente ? 10 : 0);
  const verificavel = criterios.documentos && criterios.consistente;
  const categoria = verificavel && pontos >= 75 ? 'Crítica' : verificavel && pontos >= 45 ? 'Moderada' : 'Regular';
  return { categoria, pontos, regras: { gravidade: gravidade * 10, impacto: impacto * 10, prazo: pontosPrazo, documentos: criterios.documentos ? 10 : 0, consistencia: criterios.consistente ? 10 : 0 }, versao: 1 };
}

// Centavos inteiros, limite de 35% do fundo por campanha e sobras retidas.
function distribuirFundo(receita, campanhas) {
  inteiro(receita, 'receita líquida elegível', 1, 100000000);
  const fundo = Math.floor(receita * 70 / 100);
  const manutencao = receita - fundo;
  const limite = Math.floor(fundo * 35 / 100);
  const elegiveis = campanhas.filter(c => c.verificada && c.urgencia === 'Crítica' && c.restante > 0 && c.dias >= 0);
  const pesos = elegiveis.map(c => ({ ...c, peso: (c.pontos / 100) * (1 + 7 / (c.dias + 7)) * c.restante / (c.restante + c.recebidoAnterior + 1), valor: 0 }));
  let disponivel = fundo;
  for (let rodada = 0; rodada < pesos.length + 2 && disponivel > 0; rodada++) {
    const abertos = pesos.filter(c => c.valor < Math.min(limite, c.restante));
    const total = abertos.reduce((s, c) => s + c.peso, 0);
    if (!total) break;
    const base = disponivel;
    let aplicado = 0;
    for (const c of abertos) {
      const valor = Math.min(Math.floor(base * c.peso / total), limite - c.valor, c.restante - c.valor);
      c.valor += valor; aplicado += valor;
    }
    disponivel -= aplicado;
    if (!aplicado) break;
  }
  return { fundo, manutencao, retido: disponivel, limite_percentual: 35, distribuicoes: pesos.filter(c => c.valor > 0).map(c => ({ campanha_id: c.id, valor: c.valor, peso: c.peso })), simulado: true, versao: 1 };
}

function resumoFinanceiro(meta, doacoes, anuncios = 0, rendimentos = 0) {
  for (const valor of [meta, doacoes, anuncios, rendimentos]) inteiro(valor, 'valor financeiro', 0, Number.MAX_SAFE_INTEGER);
  const arrecadado = doacoes + anuncios + rendimentos;
  if (!Number.isSafeInteger(arrecadado)) erro('Total financeiro fora do limite.');
  return { meta, doacoes, anuncios, rendimentos, arrecadado, restante: Math.max(0, meta - arrecadado), percentual: meta ? Math.min(100, arrecadado / meta * 100) : 0 };
}

function projetar(disponivel, taxaMensal, anunciosMensais, meses) {
  inteiro(disponivel, 'saldo', 0, Number.MAX_SAFE_INTEGER);
  inteiro(anunciosMensais, 'estimativa dos anúncios', 0, 100000000);
  inteiro(meses, 'meses', 1, 24);
  if (typeof taxaMensal !== 'number' || !Number.isFinite(taxaMensal) || taxaMensal < 0 || taxaMensal > 2) erro('Use uma hipótese de taxa mensal entre 0 e 2%.');
  return { rendimento_estimado: Math.floor(disponivel * ((1 + taxaMensal / 100) ** meses - 1)), anuncios_estimados: anunciosMensais * meses, hipoteses: { taxa_mensal_percentual: taxaMensal, anuncios_mensais_centavos: anunciosMensais, meses, impostos_taxas: 'Não incluídos; hipótese educativa, sem garantia.' }, estimativa: true };
}
module.exports = { classificarUrgencia, distribuirFundo, resumoFinanceiro, projetar, dataPrazo };
