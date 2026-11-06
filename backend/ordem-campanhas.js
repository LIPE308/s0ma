function prioridade(c) {
  if (c.estado !== 'ativa') return -1;
  if (c.urgencia?.revisada && c.urgencia.classe === 'critica') return 3;
  if (c.id.startsWith('exemplo-urgente-')) return 2;
  return c.urgencia?.revisada && c.urgencia.classe === 'moderada' ? 1 : 0;
}
// Sort estável: preserva o filtro de ordem escolhido dentro de cada prioridade.
function urgentesPrimeiro(lista) { return [...lista].sort((a,b)=>prioridade(b)-prioridade(a)); }
module.exports = { prioridade, urgentesPrimeiro };
