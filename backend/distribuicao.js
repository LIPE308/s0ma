// Fórmula determinística: prazo x lacuna relativa / recursos anteriormente distribuídos.
// A unidade de rateio é a campanha, com no máximo uma campanha por responsável.
function distribuirFundo(fundo, candidatas) {
  if (!Number.isSafeInteger(fundo) || fundo < 0) throw new Error('Fundo inválido.');
  const proprietarios = new Set();
  const elegiveis = [...candidatas].sort((a, b) => a.dias - b.dias || b.falta - a.falta || a.id.localeCompare(b.id)).filter(c => {
    if (c.falta <= 0 || c.dias < 0 || proprietarios.has(c.usuario_id)) return false;
    proprietarios.add(c.usuario_id); return true;
  }).map(c => {
    const prazo = c.dias <= 2 ? 3 : c.dias <= 7 ? 2 : 1;
    const lacuna = Math.max(.01, Math.min(1, c.falta / Math.max(1, c.meta)));
    const historico = 1 + Math.max(0, c.anterior || 0) / 10000;
    return { ...c, peso: prazo * lacuna / historico, limite: Math.min(c.falta, Math.floor(fundo * .35)), valor: 0, criterios: { prazo, lacuna, historico, teto_percentual: 35, versao: 'fundo-1' } };
  });
  let restante = fundo;
  for (let rodada = 0; rodada < 100 && restante > 0; rodada++) {
    const ativas = elegiveis.filter(c => c.valor < c.limite);
    if (!ativas.length) break;
    const soma = ativas.reduce((s, c) => s + c.peso, 0);
    const inicio = restante;
    const quotas = ativas.map(c => {
      const bruto = inicio * c.peso / soma;
      const valor = Math.min(c.limite - c.valor, Math.floor(bruto));
      c.valor += valor; restante -= valor;
      return { c, fracao: bruto - Math.floor(bruto) };
    });
    for (const { c } of quotas.sort((a, b) => b.fracao - a.fracao || a.c.id.localeCompare(b.c.id))) {
      if (!restante) break;
      if (c.valor < c.limite) { c.valor++; restante--; }
    }
    if (restante === inicio) break;
  }
  return { alocacoes: elegiveis.filter(c => c.valor > 0), retido: restante, limite_percentual: 35 };
}
function dividirReceita(bruto, tributos, custos) {
  if (![bruto, tributos, custos].every(Number.isSafeInteger) || bruto <= 0 || tributos < 0 || custos < 0 || tributos + custos > bruto) throw new Error('Receita inválida.');
  const liquido = bruto - tributos - custos;
  const fundo = Math.floor(liquido * 70 / 100);
  return { bruto, tributos, custos, liquido, fundo, operacao: liquido - fundo };
}
module.exports = { distribuirFundo, dividirReceita };
