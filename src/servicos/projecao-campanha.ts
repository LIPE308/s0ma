export function projetarCampanha(
  id: string,
  confirmado: number,
  meta: number,
  etapa: number,
  incluirAnuncios = false,
) {
  const hash = [...id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const passos = Math.max(0, Math.min(60, Math.floor(etapa)));
  const base = Math.max(0, Math.floor(confirmado || 0));
  const alvo = Math.max(0, Math.floor(meta || 0));
  const anuncios = incluirAnuncios ? passos * (1 + (hash % 5)) : 0;
  const doacoes = Math.floor(passos / 6) * (1000 + (hash % 1501));
  const rendimento = Math.floor(passos / 15) * (1 + (hash % 3));
  const total = base + doacoes + anuncios + rendimento;
  return {
    base,
    meta: alvo,
    anuncios,
    doacoes,
    rendimento,
    total,
    percentual: alvo ? Math.min(100, (total / alvo) * 100) : 0,
    restante: Math.max(0, alvo - total),
  };
}
