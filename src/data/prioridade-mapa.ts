import type { EstadoMapa } from '../servicos/soma2';

export const regioesBrasil = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
export type GeografiaUF = { uf: string; nome: string; regiao: string };
export type ResumoTerritorio = {
  nome: string; campanhas: number; criticas: number; moderadas: number;
  restante: number; intensidade: number; nivel: number;
};
export type UFResumida = EstadoMapa & { nome: string; regiao: string; nivel: number };

function comparar(a: ResumoTerritorio, b: ResumoTerritorio) {
  return b.criticas - a.criticas || b.moderadas - a.moderadas ||
    b.intensidade - a.intensidade || b.restante - a.restante || a.nome.localeCompare(b.nome, 'pt-BR');
}

/** Somente leitura: não concede urgência, não publica localização e não distribui dinheiro. */
export function resumirMapa(
  estados: EstadoMapa[], geografia: GeografiaUF[], apenasDinheiro = true, agora = Date.now(),
) {
  const porUF = new Map(geografia.map(e => [e.uf, e]));
  const ufs: UFResumida[] = [];
  for (const estado of estados) {
    const geo = porUF.get(estado.uf);
    if (!geo) continue;
    const campanhas = estado.campanhas.filter(c => !apenasDinheiro || c.restante > 0);
    if (!campanhas.length) continue;
    let criticas = 0, moderadas = 0, restante = 0, intensidade = 0;
    for (const c of campanhas) {
      const critica = c.urgencia.revisada && c.urgencia.classe === 'critica';
      const moderada = c.urgencia.revisada && c.urgencia.classe === 'moderada';
      criticas += Number(critica); moderadas += Number(moderada);
      restante += Math.max(0, c.restante);
      const prazo = c.urgencia.prazo ? Date.parse(c.urgencia.prazo + 'T23:59:59Z') : NaN;
      const dias = (prazo - agora) / 86400000;
      intensidade += (critica ? 3 : moderada ? 1.5 : .5) + Math.min(3, Math.max(0, c.restante) / 100000) +
        (c.urgencia.revisada && dias >= 0 && dias <= 7 ? 1 : 0);
    }
    ufs.push({ ...estado, ...geo, campanhas, criticas, moderadas, restante, intensidade, nivel: 1 });
  }
  // A lacuna é comparada apenas entre estados com pedidos financeiros nesta seleção.
  const lacunas = ufs.map(e => e.restante).filter(v => v > 0).sort((a, b) => a - b);
  const mediana = lacunas.length ? lacunas[Math.floor(lacunas.length / 2)] : Infinity;
  for (const e of ufs) e.nivel = e.criticas ? 4 : e.moderadas ? 3 : e.restante > 0 && e.restante >= mediana ? 2 : 1;
  const regioes: ResumoTerritorio[] = regioesBrasil.map(nome => {
    const lista = ufs.filter(e => e.regiao === nome);
    return {
      nome, campanhas: lista.reduce((s, e) => s + e.campanhas.length, 0),
      criticas: lista.reduce((s, e) => s + e.criticas, 0), moderadas: lista.reduce((s, e) => s + e.moderadas, 0),
      restante: lista.reduce((s, e) => s + e.restante, 0), intensidade: lista.reduce((s, e) => s + e.intensidade, 0),
      nivel: Math.max(0, ...lista.map(e => e.nivel)),
    };
  }).sort(comparar);
  ufs.sort((a, b) => comparar({ ...a, campanhas: a.campanhas.length }, { ...b, campanhas: b.campanhas.length }));
  return { ufs, regioes, total: ufs.reduce((s, e) => s + e.campanhas.length, 0), restante: ufs.reduce((s, e) => s + e.restante, 0) };
}

export function descricaoNivel(nivel: number) {
  return ['Sem campanhas nesta seleção', 'Pedidos ativos', 'Maior lacuna financeira', 'Urgência moderada revisada', 'Urgência crítica revisada'][nivel] || 'Sem campanhas nesta seleção';
}
