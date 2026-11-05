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
  const anuncios = incluirAnuncios
    ? 30 + (hash % 370) + passos * (8 + (hash % 39))
    : 0;
  const doacoes = Math.floor(passos / 4) * (1500 + (hash % 8501));
  const rendimento = passos * (1 + (hash % 5));
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
