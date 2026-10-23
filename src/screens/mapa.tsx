import { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Disclosure, EmptyState, Screen, useTheme } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { useDados } from '../servicos/api';
import estados from '../data/brasil-uf.json';

type CampanhaMapa = { id: string; titulo: string; categoria: string; prazo: string; uf: string | null; urgencia: string; verificada: number };
const regioes: Record<string, string[]> = { Brasil: estados.map(e => e.uf), Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'], Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'], 'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'], Sudeste: ['ES', 'MG', 'RJ', 'SP'], Sul: ['PR', 'RS', 'SC'] };
export function Mapa() {
  const roteador = useRouter(); const { colors } = useTheme(); const consulta = useDados<{ campanhas: CampanhaMapa[]; aviso: string }>('/mapa');
  const [uf, definirUf] = useState('Todos'); const [regiao, definirRegiao] = useState('Brasil'); const [categoria, definirCategoria] = useState('Todas'); const [urgencia, definirUrgencia] = useState('Todas'); const [verificacao, definirVerificacao] = useState('Todas');
  const [zoom, definirZoom] = useState(1); const [pan, definirPan] = useState({ x: 0, y: 0 }); const inicio = useRef(pan); const distancia = useRef(0); const zoomInicial = useRef(1);
  const gesto = PanResponder.create({ onStartShouldSetPanResponder: e => e.nativeEvent.touches.length > 1, onMoveShouldSetPanResponder: e => zoom > 1 || e.nativeEvent.touches.length > 1, onPanResponderGrant: e => { inicio.current = pan; zoomInicial.current = zoom; const t = e.nativeEvent.touches; distancia.current = t.length > 1 ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) : 0; }, onPanResponderMove: (e, g) => {
    const t = e.nativeEvent.touches;
    if (t.length > 1 && distancia.current) definirZoom(Math.max(1, Math.min(3, zoomInicial.current * Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) / distancia.current)));
    else definirPan({ x: Math.max(-130, Math.min(130, inicio.current.x - g.dx / zoom)), y: Math.max(-150, Math.min(150, inicio.current.y - g.dy / zoom)) });
  } });
  const lista = (consulta.dados?.campanhas || []).filter(c => (categoria === 'Todas' || c.categoria === categoria) && (urgencia === 'Todas' || c.urgencia === urgencia) && (verificacao === 'Todas' || !!c.verificada));
  const filtrada = lista.filter(c => (uf === 'Todos' || c.uf === uf) && (regiao === 'Brasil' || !!c.uf && regioes[regiao].includes(c.uf)));
  const centro = zoom > 1 && uf !== 'Todos' ? estados.find(e => e.uf === uf) : null;
  const tamanho = 420 / zoom;
  return <Screen title="Mapa solidário" heading="Onde podemos somar." subtitle="Campanhas cadastradas, vistas por estado."><EstadoConexao {...consulta}/>
    <Disclosure title="Filtrar por região, categoria ou urgência"><Choices label="Região" options={Object.keys(regioes)} selected={regiao} onSelect={r => { definirRegiao(r); definirUf('Todos'); }}/>
    <Choices label="Categoria" options={['Todas', ...new Set((consulta.dados?.campanhas || []).map(c => c.categoria))]} selected={categoria} onSelect={definirCategoria}/>
    <Choices label="Urgência" options={['Todas', 'Crítica', 'Moderada', 'Regular']} selected={urgencia} onSelect={definirUrgencia}/><Choices label="Verificação" options={['Todas', 'Verificação vigente']} selected={verificacao} onSelect={definirVerificacao}/>
    </Disclosure><View {...gesto.panHandlers} style={{ height: 420, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.brandSoft }}>
      <Svg width="100%" height="100%" viewBox={`${(centro?.x || 210) - tamanho / 2 + pan.x} ${(centro?.y || 210) - tamanho / 2 + pan.y} ${tamanho} ${tamanho}`} accessibilityLabel="Mapa dos estados do Brasil, com círculos proporcionais ao número de campanhas filtradas">
        {estados.map(e => { const campanhas = lista.filter(c => c.uf === e.uf); const total = campanhas.length; const critica = campanhas.some(c => c.urgencia === 'Crítica' && !!c.verificada); const ativo = regioes[regiao].includes(e.uf); const cor = critica ? colors.accent : colors.primary; return <G key={e.uf} onPress={() => { definirUf(e.uf); definirPan({ x: 0, y: 0 }); }}><Path d={e.path} fill={e.uf === uf ? colors.primary : ativo ? colors.surface : colors.line} stroke={colors.muted} strokeWidth={.6}/>{total > 0 && ativo ? <Circle cx={e.x} cy={e.y} r={Math.min(10, 5 + Math.sqrt(total))} fill={cor} opacity={.55} stroke={critica ? colors.accent : 'none'} strokeWidth={critica ? 2 : 0}/> : null}<SvgText x={e.x} y={e.y + 2} fontSize={7} fontWeight={total ? 'bold' : 'normal'} textAnchor="middle" fill={e.uf === uf || total && ativo ? colors.onHero : colors.ink}>{e.uf}</SvgText></G>; })}
      </Svg>
    </View><View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}><Button secondary title="Aproximar" onPress={() => definirZoom(z => Math.min(3, z + .5))}/><Button secondary title="Afastar" onPress={() => definirZoom(z => Math.max(1, z - .5))}/><Button secondary title="Ver Brasil inteiro" onPress={() => { definirZoom(1); definirPan({ x: 0, y: 0 }); definirUf('Todos'); }}/></View>
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }}/><Copy muted>Campanhas</Copy></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }}/><Copy muted>Emergências verificadas</Copy></View></View>
    <Copy muted>Toque em um estado para encontrar campanhas. Aproxime e arraste para ver melhor.</Copy>
    <Disclosure title="Selecionar estado pela lista"><Choices label="Selecionar estado" options={['Todos', ...regioes[regiao]]} selected={uf} onSelect={u => { definirUf(u); definirPan({ x: 0, y: 0 }); }}/>
    </Disclosure><Copy muted>Localização por estado, sem endereços pessoais.</Copy>
    <Copy>{uf === 'Todos' ? regiao : uf} · {filtrada.length} campanhas encontradas</Copy>
    {filtrada.map(c => <Card key={c.id} title={c.titulo} subtitle={`${c.uf || 'UF não informada'} · ${c.categoria} · ${c.urgencia}${c.verificada ? ' · verificada' : ''}`} onPress={() => roteador.push({ pathname: '/campanha', params: { id: c.id } })}/>)}{!consulta.carregando && !consulta.erro && !filtrada.length ? <EmptyState title="Nenhuma campanha nesta seleção.">Experimente outro estado ou filtro. A ausência de cadastros não significa ausência de necessidades.</EmptyState> : null}
    <Disclosure title="Sobre este mapa"><Copy muted>{consulta.dados?.aviso}</Copy><Copy muted>Malha simplificada do IBGE. Os círculos indicam campanhas cadastradas, não a necessidade social absoluta. {lista.filter(c => !c.uf).length} campanhas não informaram o estado e aparecem apenas na lista nacional.</Copy></Disclosure>
  </Screen>;
}
