export type CameraMapa = { x: number; y: number; zoom: number };
export type PontoMapa = { x: number; y: number };
export const cameraInicial: CameraMapa = { x: 0, y: 0, zoom: 1 };
export const zoomMaximo = 4;
const limitar = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function limitarCamera(c: CameraMapa): CameraMapa {
  const zoom = limitar(c.zoom, 1, zoomMaximo);
  return { zoom, x: limitar(c.x, 0, 600 - 600 / zoom), y: limitar(c.y, 0, 580 - 580 / zoom) };
}

export function ampliarCamera(c: CameraMapa, zoom: number, ancora: PontoMapa = { x: .5, y: .5 }): CameraMapa {
  const z = limitar(zoom, 1, zoomMaximo);
  return limitarCamera({ zoom: z, x: c.x + ancora.x * (600 / c.zoom - 600 / z), y: c.y + ancora.y * (580 / c.zoom - 580 / z) });
}

// O SVG usa preserveAspectRatio="xMidYMid meet": desconta as margens do desenho.
export function pontoNoMapa(p: PontoMapa, largura: number, altura: number): PontoMapa {
  const escala = Math.min(largura / 600, altura / 580);
  return { x: (p.x - (largura - 600 * escala) / 2) / (600 * escala), y: (p.y - (altura - 580 * escala) / 2) / (580 * escala) };
}

export function gestoCamera(c: CameraMapa, inicio: PontoMapa[], atual: PontoMapa[], largura: number, altura: number): CameraMapa {
  if (!inicio.length || inicio.length !== atual.length || largura <= 0 || altura <= 0) return c;
  const centro = (ps: PontoMapa[]) => ps.length > 1 ? { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 } : ps[0];
  const distancia = (ps: PontoMapa[]) => Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
  const a = pontoNoMapa(centro(inicio), largura, altura), b = pontoNoMapa(centro(atual), largura, altura);
  const zoom = limitar(inicio.length > 1 ? c.zoom * distancia(atual) / Math.max(1, distancia(inicio)) : c.zoom, 1, zoomMaximo);
  return limitarCamera({ zoom, x: c.x + a.x * 600 / c.zoom - b.x * 600 / zoom, y: c.y + a.y * 580 / c.zoom - b.y * 580 / zoom });
}
