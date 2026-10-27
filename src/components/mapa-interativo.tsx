import { useMemo, useRef } from 'react';
import { PanResponder, View, type GestureResponderEvent } from 'react-native';
import { gestoCamera, type CameraMapa, type PontoMapa } from '../data/camera-mapa';
import type { PropsMapaInterativo } from './mapa-interativo.types';

export function MapaInterativo({ camera, onChange, altura, children }: PropsMapaInterativo) {
  const area = useRef<View>(null), atual = useRef({ camera, onChange });
  atual.current = { camera, onChange };
  const quadro = useRef({ x: 0, y: 0, largura: 0, altura });
  const base = useRef<{ camera: CameraMapa; pontos: PontoMapa[] } | null>(null);
  const medir = () => area.current?.measureInWindow((x, y, largura, altura) => { quadro.current = { x, y, largura, altura }; });
  const gesto = useMemo(() => {
    const pontos = (e: GestureResponderEvent) => e.nativeEvent.touches.slice(0, 2).map(t => ({ x: t.pageX - quadro.current.x, y: t.pageY - quadro.current.y }));
    const iniciar = (e: GestureResponderEvent) => { base.current = { camera: atual.current.camera, pontos: pontos(e) }; };
    return PanResponder.create({
      onStartShouldSetPanResponder: e => e.nativeEvent.touches.length > 1,
      onMoveShouldSetPanResponderCapture: (e, g) => e.nativeEvent.touches.length > 1 || Math.hypot(g.dx, g.dy) > 5,
      onPanResponderGrant: iniciar,
      onPanResponderStart: iniciar,
      onPanResponderMove: e => {
        const ps = pontos(e), b = base.current, q = quadro.current;
        if (!b || ps.length !== b.pontos.length) { iniciar(e); return; }
        atual.current.onChange(gestoCamera(b.camera, b.pontos, ps, q.largura, q.altura));
      },
      onPanResponderEnd: iniciar,
      onPanResponderRelease: () => { base.current = null; },
      onPanResponderTerminate: () => { base.current = null; },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    });
  }, []);
  return <View ref={area} testID="mapa-interativo" collapsable={false} onLayout={medir} onTouchStart={medir} {...gesto.panHandlers} style={{ width: '100%', height: altura }}>{children}</View>;
}
