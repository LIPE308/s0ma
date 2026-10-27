import { useEffect, useRef } from 'react';
import { ampliarCamera, gestoCamera, pontoNoMapa, type CameraMapa, type PontoMapa } from '../data/camera-mapa';
import type { PropsMapaInterativo } from './mapa-interativo.types';

export function MapaInterativo({ camera, onChange, altura, children }: PropsMapaInterativo) {
  const area = useRef<HTMLDivElement>(null), atual = useRef({ camera, onChange });
  atual.current = { camera, onChange };
  const pontos = useRef(new Map<number, PontoMapa>());
  const base = useRef<{ camera: CameraMapa; pontos: PontoMapa[] } | null>(null);
  const bloquearClique = useRef(0);
  const reposicionar = () => { base.current = { camera: atual.current.camera, pontos: [...pontos.current.values()] }; };
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect(), { camera: c, onChange: mudar } = atual.current;
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1);
      mudar(ampliarCamera(c, c.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * .002), pontoNoMapa({ x: e.clientX - rect.left, y: e.clientY - rect.top }, rect.width, rect.height)));
    };
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, []);
  return <div ref={area} data-testid="mapa-interativo" style={{ width: '100%', height: altura, touchAction: 'none', userSelect: 'none', cursor: camera.zoom > 1 ? 'grab' : 'zoom-in' }}
    onPointerDown={e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      pontos.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      reposicionar();
      if (pontos.current.size > 1) bloquearClique.current = Date.now() + 400;
    }}
    onPointerMove={e => {
      if (!pontos.current.has(e.pointerId) || !base.current) return;
      const r = e.currentTarget.getBoundingClientRect();
      pontos.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      const ps = [...pontos.current.values()], b = base.current;
      if (ps.length > 1 || Math.hypot(ps[0].x - b.pontos[0].x, ps[0].y - b.pontos[0].y) > 5) {
        e.currentTarget.setPointerCapture(e.pointerId);
        bloquearClique.current = Date.now() + 400;
        atual.current.onChange(gestoCamera(b.camera, b.pontos, ps, r.width, r.height));
      }
    }}
    onPointerUp={e => { pontos.current.delete(e.pointerId); reposicionar(); }}
    onPointerCancel={e => { pontos.current.delete(e.pointerId); reposicionar(); bloquearClique.current = Date.now() + 400; }}
    onLostPointerCapture={e => {
      // Em telas touch, transferir a captura implícita do SVG para a área também
      // emite este evento no filho. Só encerra quando a própria área perde a captura.
      if (e.target === e.currentTarget) { pontos.current.delete(e.pointerId); reposicionar(); }
    }}
    onPointerLeave={e => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) { pontos.current.delete(e.pointerId); reposicionar(); }
    }}
    onClickCapture={e => { if (Date.now() < bloquearClique.current) { e.preventDefault(); e.stopPropagation(); } }}
  >{children}</div>;
}
