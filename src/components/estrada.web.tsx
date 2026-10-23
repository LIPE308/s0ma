import { useEffect, useRef, useState } from 'react';
import { EstradaAlternativa, type EstradaProps } from './estrada-base';
import { useReducedMotion } from '../design/motion';
import { useTheme } from './ui';

export default function Estrada(props: EstradaProps) {
  const host = useRef<HTMLDivElement>(null); const [falhou, definirFalhou] = useState(false);
  const reduzido = useReducedMotion(); const { dark } = useTheme();
  const selecionar = useRef(props.aoSelecionar); selecionar.current = props.aoSelecionar;
  useEffect(() => {
    if (!host.current || falhou) return;
    let desmontado = false; let limpar = () => {};
    import('three').then(T => {
      if (desmontado || !host.current) return;
      const elemento = host.current;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ antialias: false, powerPreference: 'low-power' }); } catch { definirFalhou(true); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(dark ? '#222532' : '#e9eeff');
      elemento.appendChild(renderer.domElement);
      renderer.domElement.style.touchAction = 'pan-y';
      const scene = new T.Scene(); scene.fog = new T.Fog(dark ? '#222532' : '#e9eeff', 28, 68);
      const camera = new T.PerspectiveCamera(47, 1, .1, 100);
      scene.add(new T.HemisphereLight(0xffffff, 0x597397, 2.4));
      const luz = new T.DirectionalLight(0xffffff, 3); luz.position.set(-8, 18, 12); scene.add(luz);
      const curva = new T.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => new T.Vector3(Math.sin(i * .85) * 4, 0, 9 - i * 4.4)));
      const material = (cor: string) => new T.MeshStandardMaterial({ color: cor, roughness: .4, metalness: .15 });
      function faixa(largura: number, cor: string, altura: number, fim = 1) {
        const vertices: number[] = [], indices: number[] = [];
        for (let i = 0; i <= 150; i++) {
          const t = i / 150 * fim, p = curva.getPoint(t), dir = curva.getTangent(t), n = new T.Vector3(-dir.z, 0, dir.x).multiplyScalar(largura / 2);
          vertices.push(p.x + n.x, altura, p.z + n.z, p.x - n.x, altura, p.z - n.z);
          if (i < 150) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals();
        const m = material(cor); m.side = T.DoubleSide; scene.add(new T.Mesh(g, m));
      }
      faixa(4.5, '#ffffff', -.04); faixa(4.1, '#53607c', 0); if (props.percentual > 0) faixa(4, '#1748f5', .025, props.percentual / 100);
      for (let i = 0; i < 42; i++) {
        const p = curva.getPoint(i / 42), d = curva.getTangent(i / 42);
        const linha = new T.Mesh(new T.BoxGeometry(.08, .035, .42), material('#dce5ff')); linha.position.copy(p); linha.position.y = .07; linha.rotation.y = Math.atan2(d.x, d.z); scene.add(linha);
      }
      const alvos: InstanceType<typeof T.Mesh>[] = [];
      props.marcos.forEach((marco, i) => {
        const t = i / Math.max(1, props.marcos.length - 1), ponto = curva.getPoint(t), grupo = new T.Group(); grupo.position.copy(ponto);
        const cor = marco.concluido ? '#e6ba58' : '#c1c9da', mat = material(cor);
        const base = new T.Mesh(new T.CylinderGeometry(.76, .9, .25, 20), material(i === props.selecionado ? '#1748f5' : marco.concluido ? '#345642' : '#8893aa')); base.position.y = .17; grupo.add(base);
        const adicionar = (geo: import('three').BufferGeometry, x: number, y: number, z = 0) => { const mesh = new T.Mesh(geo, mat); mesh.position.set(x, y, z); grupo.add(mesh); return mesh; };
        if (marco.icone === 'pessoas') {
          for (const x of [-.35, .35]) { adicionar(new T.SphereGeometry(.25, 12, 8), x, 1.6); adicionar(new T.CylinderGeometry(.2, .3, .65, 12), x, 1); }
        } else if (marco.icone === 'trofeu') {
          adicionar(new T.CylinderGeometry(.65, .23, .7, 16), 0, 1.5); adicionar(new T.CylinderGeometry(.12, .12, .6, 12), 0, .9); adicionar(new T.BoxGeometry(.85, .14, .6), 0, .55);
          for (const x of [-.6, .6]) { const a = adicionar(new T.TorusGeometry(.33, .08, 6, 14), x, 1.55); a.scale.x = .7; }
        } else if (marco.icone === 'coracao') {
          const shape = new T.Shape(); shape.moveTo(0, .25); shape.bezierCurveTo(-1, 1.05, -1, -.1, 0, -.7); shape.bezierCurveTo(1, -.1, 1, 1.05, 0, .25);
          const m = adicionar(new T.ExtrudeGeometry(shape, { depth: .3, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .06, bevelThickness: .06 }), 0, 1.3); m.material = material('#d97472');
        } else if (marco.icone === 'grafico') {
          for (let n = 0; n < 3; n++) adicionar(new T.BoxGeometry(.28, .45 + n * .35, .35), (n - 1) * .4, .65 + n * .175);
        } else if (marco.icone === 'anuncio') {
          const cone = adicionar(new T.CylinderGeometry(.55, .17, 1, 16), 0, 1.35); cone.rotation.z = -Math.PI / 2;
          adicionar(new T.BoxGeometry(.17, .6, .17), -.2, .85);
        } else {
          for (let n = 0; n < 3; n++) { const moeda = adicionar(new T.CylinderGeometry(.55, .55, .18, 20), n * .08, .55 + n * .22); moeda.rotation.z = .1; }
        }
        const alvo = new T.Mesh(new T.SphereGeometry(1.1, 8, 6), new T.MeshBasicMaterial({ visible: false })); alvo.position.y = 1; alvo.userData.indice = i; grupo.add(alvo); alvos.push(alvo); scene.add(grupo);
      });
      const foco = curva.getPoint(props.selecionado / Math.max(1, props.marcos.length - 1));
      const destino = new T.Vector3(foco.x * .35, 13, Math.max(9, foco.z + 21));
      camera.position.set(0, 15, 24); camera.lookAt(0, 0, -12);
      let frame = 0, inicio = 0;
      const desenhar = (tempo: number) => {
        if (!inicio) inicio = tempo;
        const t = reduzido ? 1 : Math.min(1, (tempo - inicio) / 600), suavizado = 1 - (1 - t) ** 3;
        camera.position.lerpVectors(new T.Vector3(0, 15, 24), destino, suavizado); camera.lookAt(foco.x * .4, 0, -12 + foco.z * .2); renderer.render(scene, camera);
        if (t < 1) frame = requestAnimationFrame(desenhar);
      };
      const tamanho = () => { renderer.setSize(elemento.clientWidth, 420); camera.aspect = elemento.clientWidth / 420; camera.updateProjectionMatrix(); renderer.render(scene, camera); };
      const resize = new ResizeObserver(tamanho); resize.observe(elemento); tamanho(); frame = requestAnimationFrame(desenhar);
      const selecionarPonto = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect(); const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
        const hit = ray.intersectObjects(alvos)[0]; if (hit) selecionar.current(hit.object.userData.indice);
      };
      const perda = (e: Event) => { e.preventDefault(); definirFalhou(true); };
      renderer.domElement.addEventListener('pointerup', selecionarPonto); renderer.domElement.addEventListener('webglcontextlost', perda);
      limpar = () => { cancelAnimationFrame(frame); resize.disconnect(); renderer.domElement.removeEventListener('pointerup', selecionarPonto); renderer.domElement.removeEventListener('webglcontextlost', perda); scene.traverse(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose(); } }); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
    }).catch(() => definirFalhou(true));
    return () => { desmontado = true; limpar(); };
  }, [props.marcos, props.percentual, props.selecionado, dark, reduzido, falhou]);
  if (falhou) return <EstradaAlternativa {...props}/>;
  return <div ref={host} role="img" aria-label="Estrada 3D em perspectiva. Use os botões de marcos abaixo para navegar por teclado." style={{ width: '100%', height: 420, borderRadius: 28, overflow: 'hidden' }}/>;
}
