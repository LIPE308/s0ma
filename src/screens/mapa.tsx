import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Choices, Copy, Disclosure, EmptyState, Screen, Tag, useTheme } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { useDados } from '../servicos/api';
import estadosBase from '../data/brasil-uf.json';

type CampanhaMapa = {
  id: string;
  titulo: string;
  categoria: string;
  prazo: string;
  regiao?: string;
  uf: string | null;
  urgencia: string;
  verificada: number;
};

// Centros geométricos e visuais exatos das 27 UFs brasileiras
const centrosUfAjustados: Record<string, { x: number; y: number }> = {
  AC: { x: 37, y: 152 },
  AL: { x: 373, y: 156 },
  AM: { x: 92, y: 98 },
  AP: { x: 217, y: 44 },
  BA: { x: 320, y: 194 },
  CE: { x: 347, y: 114 },
  DF: { x: 262, y: 218 },
  ES: { x: 332, y: 256 },
  GO: { x: 244, y: 218 },
  MA: { x: 287, y: 115 },
  MG: { x: 286, y: 246 },
  MS: { x: 194, y: 264 },
  MT: { x: 181, y: 187 },
  PA: { x: 215, y: 96 },
  PB: { x: 372, y: 132 },
  PE: { x: 360, y: 144 },
  PI: { x: 308, y: 129 },
  PR: { x: 226, y: 306 },
  RJ: { x: 310, y: 281 },
  RN: { x: 372, y: 119 },
  RO: { x: 107, y: 168 },
  RR: { x: 122, y: 41 },
  RS: { x: 205, y: 362 },
  SC: { x: 230, y: 335 },
  SE: { x: 366, y: 165 },
  SP: { x: 254, y: 285 },
  TO: { x: 258, y: 153 },
};

const estados = estadosBase.map(e => {
  const ajustado = centrosUfAjustados[e.uf];
  return ajustado ? { ...e, x: ajustado.x, y: ajustado.y } : e;
});

const regioes: Record<string, string[]> = {
  Brasil: estados.map(e => e.uf),
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
};

// Resolução inteligente da UF com base na UF salva ou no campo de região/cidade
function inferirUf(uf?: string | null, regiao?: string): string | null {
  if (uf && uf.trim() && uf.trim() !== 'Não informar') return uf.trim().toUpperCase();
  if (!regiao) return null;
  const texto = regiao.toUpperCase();
  const m = texto.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (m) return m[1];
  if (texto.includes('SÃO PAULO') || texto.includes('SAO PAULO') || texto.includes('CAMPINAS') || texto.includes('SANTOS') || texto.includes('RIBEIRÃO PRETO') || texto.includes('RIBEIRAO PRETO')) return 'SP';
  if (texto.includes('RIO DE JANEIRO') || texto.includes('NITERÓI') || texto.includes('NITEROI')) return 'RJ';
  if (texto.includes('MINAS GERAIS') || texto.includes('BELO HORIZONTE') || texto.includes('UBERLÂNDIA') || texto.includes('UBERLANDIA') || texto.includes('JUIZ DE FORA')) return 'MG';
  if (texto.includes('PARANÁ') || texto.includes('PARANA') || texto.includes('CURITIBA') || texto.includes('LONDRINA') || texto.includes('MARINGÁ') || texto.includes('MARINGA')) return 'PR';
  if (texto.includes('RIO GRANDE DO SUL') || texto.includes('PORTO ALEGRE') || texto.includes('CAXIAS DO SUL') || texto.includes('PELOTAS')) return 'RS';
  if (texto.includes('SANTA CATARINA') || texto.includes('FLORIANÓPOLIS') || texto.includes('FLORIANOPOLIS') || texto.includes('JOINVILLE') || texto.includes('BLUMENAU')) return 'SC';
  if (texto.includes('BAHIA') || texto.includes('SALVADOR') || texto.includes('FEIRA DE SANTANA')) return 'BA';
  if (texto.includes('PERNAMBUCO') || texto.includes('RECIFE') || texto.includes('OLINDA') || texto.includes('CARUARU')) return 'PE';
  if (texto.includes('CEARÁ') || texto.includes('CEARA') || texto.includes('FORTALEZA')) return 'CE';
  if (texto.includes('DISTRITO FEDERAL') || texto.includes('BRASÍLIA') || texto.includes('BRASILIA')) return 'DF';
  if (texto.includes('GOIÁS') || texto.includes('GOIAS') || texto.includes('GOIÂNIA') || texto.includes('GOIANIA')) return 'GO';
  if (texto.includes('AMAZONAS') || texto.includes('MANAUS')) return 'AM';
  if (texto.includes('PARÁ') || texto.includes('PARA') || texto.includes('BELÉM') || texto.includes('BELEM')) return 'PA';
  if (texto.includes('MARANHÃO') || texto.includes('MARANHAO') || texto.includes('SÃO LUÍS') || texto.includes('SAO LUIS')) return 'MA';
  if (texto.includes('ESPÍRITO SANTO') || texto.includes('ESPIRITO SANTO') || texto.includes('VITÓRIA') || texto.includes('VITORIA')) return 'ES';
  if (texto.includes('MATO GROSSO DO SUL') || texto.includes('CAMPO GRANDE')) return 'MS';
  if (texto.includes('MATO GROSSO') || texto.includes('CUIABÁ') || texto.includes('CUIABA')) return 'MT';
  if (texto.includes('PIAUÍ') || texto.includes('PIAUI') || texto.includes('TERESINA')) return 'PI';
  if (texto.includes('ALAGOAS') || texto.includes('MACEIÓ') || texto.includes('MACEIO')) return 'AL';
  if (texto.includes('RIO GRANDE DO NORTE') || texto.includes('NATAL')) return 'RN';
  if (texto.includes('PARAÍBA') || texto.includes('PARAIBA') || texto.includes('JOÃO PESSOA') || texto.includes('JOAO PESSOA')) return 'PB';
  if (texto.includes('SERGIPE') || texto.includes('ARACAJU')) return 'SE';
  if (texto.includes('RONDÔNIA') || texto.includes('RONDONIA') || texto.includes('PORTO VELHO')) return 'RO';
  if (texto.includes('TOCANTINS') || texto.includes('PALMAS')) return 'TO';
  if (texto.includes('ACRE') || texto.includes('RIO BRANCO')) return 'AC';
  if (texto.includes('AMAPÁ') || texto.includes('AMAPA') || texto.includes('MACAPÁ') || texto.includes('MACAPA')) return 'AP';
  if (texto.includes('RORAIMA') || texto.includes('BOA VISTA')) return 'RR';
  return null;
}

// Deslocamentos geográficos conhecidos para cidades polo, preservando o centro livre para a sigla
const offsetsCidades: Record<string, { dx: number; dy: number }> = {
  'sao paulo': { dx: 6, dy: 8 },
  'são paulo': { dx: 6, dy: 8 },
  'campinas': { dx: 2, dy: -6 },
  'santos': { dx: 14, dy: 14 },
  'ribeirao preto': { dx: 2, dy: -18 },
  'ribeirão preto': { dx: 2, dy: -18 },
  'sorocaba': { dx: -6, dy: 6 },
  'sao jose dos campos': { dx: 14, dy: 4 },
  'são josé dos campos': { dx: 14, dy: 4 },
  'rio de janeiro': { dx: -4, dy: 4 },
  'niteroi': { dx: 4, dy: 4 },
  'niterói': { dx: 4, dy: 4 },
  'petropolis': { dx: -2, dy: -4 },
  'petrópolis': { dx: -2, dy: -4 },
  'campos': { dx: 14, dy: -8 },
  'belo horizonte': { dx: 4, dy: 6 },
  'uberlandia': { dx: -28, dy: -6 },
  'uberlândia': { dx: -28, dy: -6 },
  'juiz de fora': { dx: 6, dy: 24 },
  'montes claros': { dx: 2, dy: -20 },
  'curitiba': { dx: 12, dy: 8 },
  'londrina': { dx: -4, dy: -12 },
  'maringa': { dx: -12, dy: -8 },
  'maringá': { dx: -12, dy: -8 },
  'foz do iguacu': { dx: -24, dy: 10 },
  'foz do iguaçu': { dx: -24, dy: 10 },
  'porto alegre': { dx: 14, dy: 8 },
  'caxias do sul': { dx: 10, dy: -6 },
  'pelotas': { dx: 8, dy: 20 },
  'florianopolis': { dx: 14, dy: 4 },
  'florianópolis': { dx: 14, dy: 4 },
  'joinville': { dx: 10, dy: -8 },
  'blumenau': { dx: 8, dy: -2 },
  'salvador': { dx: 22, dy: -2 },
  'feira de santana': { dx: 14, dy: -6 },
  'vitoria da conquista': { dx: 6, dy: 18 },
  'recife': { dx: 22, dy: -2 },
  'olinda': { dx: 22, dy: -4 },
  'caruaru': { dx: 6, dy: -2 },
  'fortaleza': { dx: 6, dy: -12 },
  'sobral': { dx: -8, dy: -10 },
  'juazeiro do norte': { dx: 4, dy: 14 },
  'brasilia': { dx: 1, dy: 1 },
  'brasília': { dx: 1, dy: 1 },
  'goiania': { dx: 2, dy: 6 },
  'goiânia': { dx: 2, dy: 6 },
  'manaus': { dx: 8, dy: -4 },
  'belem': { dx: 10, dy: -8 },
  'belém': { dx: 10, dy: -8 },
};

function calcularPosicaoCampanha(estadoX: number, estadoY: number, campanha: CampanhaMapa, indice: number, total: number) {
  const regiaoTexto = (campanha.regiao || '').trim().toLowerCase();
  for (const [chave, offset] of Object.entries(offsetsCidades)) {
    if (regiaoTexto.includes(chave)) {
      const dispersao = total > 1 ? (indice % 3 - 1) * 3 : 0;
      return {
        x: Math.round((estadoX + offset.dx + dispersao) * 10) / 10,
        y: Math.round((estadoY + offset.dy + (indice % 2 ? 2 : -2)) * 10) / 10,
      };
    }
  }

  // Raio ao redor da sigla, garantindo que o centro com a letra do estado nunca seja bloqueado
  const raio = Math.min(16, 9 + total * 1.4);
  const angulo = (indice * 2 * Math.PI) / Math.max(1, total) - Math.PI / 4;
  return {
    x: Math.round((estadoX + Math.cos(angulo) * raio) * 10) / 10,
    y: Math.round((estadoY + Math.sin(angulo) * raio) * 10) / 10,
  };
}

export function Mapa() {
  const roteador = useRouter();
  const { colors, s } = useTheme();
  const consulta = useDados<{ campanhas: CampanhaMapa[]; aviso: string }>('/mapa');

  const [uf, definirUf] = useState('Todos');
  const [regiao, definirRegiao] = useState('Brasil');
  const [categoria, definirCategoria] = useState('Todas');
  const [urgencia, definirUrgencia] = useState('Todas');
  const [verificacao, definirVerificacao] = useState('Todas');

  const [zoom, definirZoom] = useState(1);
  const [pan, definirPan] = useState({ x: 0, y: 0 });
  const [hoverUf, definirHoverUf] = useState<string | null>(null);
  const [hoverCampanha, definirHoverCampanha] = useState<CampanhaMapa | null>(null);
  const [arrastando, definirArrastando] = useState(false);

  const containerRef = useRef<View>(null);
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const arrastoAtivo = useRef(false);
  const pontoInicial = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const moveuDuranteArrasto = useRef(false);

  // Drag e Zoom de alta precisão 1:1 na Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const elemento = containerRef.current as unknown as HTMLElement | null;
    if (!elemento) return;

    const aoAbaixarMouse = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest('button') || alvo?.closest('[role="button"]')) return;

      arrastoAtivo.current = true;
      moveuDuranteArrasto.current = false;
      pontoInicial.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      definirArrastando(true);
      e.preventDefault();
    };

    const aoMoverMouse = (e: MouseEvent) => {
      if (!arrastoAtivo.current) return;
      const rect = elemento.getBoundingClientRect();
      const tamanhoViewBox = 420 / zoomRef.current;
      const escala = tamanhoViewBox / Math.max(1, rect.width);
      const deltaX = (e.clientX - pontoInicial.current.x) * escala;
      const deltaY = (e.clientY - pontoInicial.current.y) * escala;

      if (Math.hypot(deltaX, deltaY) > 0.8) {
        moveuDuranteArrasto.current = true;
      }

      definirPan({
        x: Math.max(-210, Math.min(210, pontoInicial.current.panX - deltaX)),
        y: Math.max(-210, Math.min(210, pontoInicial.current.panY - deltaY)),
      });
    };

    const aoSoltarMouse = () => {
      if (arrastoAtivo.current) {
        arrastoAtivo.current = false;
        definirArrastando(false);
      }
    };

    const aoRolar = (evento: WheelEvent) => {
      evento.preventDefault();
      const delta = evento.deltaY < 0 ? 0.35 : -0.35;
      const zAtual = zoomRef.current;
      const novoZoom = Math.max(1, Math.min(4.8, Math.round((zAtual + delta) * 10) / 10));
      if (novoZoom === zAtual) return;

      const rect = elemento.getBoundingClientRect();
      const fracX = (evento.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const fracY = (evento.clientY - rect.top) / Math.max(1, rect.height) - 0.5;

      const tamAntes = 420 / zAtual;
      const tamDepois = 420 / novoZoom;
      const ajusteX = fracX * (tamAntes - tamDepois);
      const ajusteY = fracY * (tamAntes - tamDepois);

      definirZoom(novoZoom);
      definirPan(p => ({
        x: Math.max(-210, Math.min(210, p.x + ajusteX)),
        y: Math.max(-210, Math.min(210, p.y + ajusteY)),
      }));
    };

    elemento.addEventListener('mousedown', aoAbaixarMouse);
    window.addEventListener('mousemove', aoMoverMouse);
    window.addEventListener('mouseup', aoSoltarMouse);
    elemento.addEventListener('wheel', aoRolar, { passive: false });

    return () => {
      elemento.removeEventListener('mousedown', aoAbaixarMouse);
      window.removeEventListener('mousemove', aoMoverMouse);
      window.removeEventListener('mouseup', aoSoltarMouse);
      elemento.removeEventListener('wheel', aoRolar);
    };
  }, []);

  // Suporte a gestos touch nativos em dispositivos móveis
  const gestoMobile = PanResponder.create({
    onStartShouldSetPanResponder: () => Platform.OS !== 'web',
    onMoveShouldSetPanResponder: (_, g) => Platform.OS !== 'web' && Math.hypot(g.dx, g.dy) > 3,
    onPanResponderGrant: () => {
      definirArrastando(true);
      pontoInicial.current = {
        x: 0,
        y: 0,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    },
    onPanResponderMove: (_, g) => {
      const escala = (420 / zoomRef.current) / 400;
      definirPan({
        x: Math.max(-210, Math.min(210, pontoInicial.current.panX - g.dx * escala)),
        y: Math.max(-210, Math.min(210, pontoInicial.current.panY - g.dy * escala)),
      });
    },
    onPanResponderRelease: () => definirArrastando(false),
    onPanResponderTerminate: () => definirArrastando(false),
  });

  // Lista normalizada com inferência garantida de estado e cidade
  const todasNormalizadas = useMemo(() => {
    return (consulta.dados?.campanhas || []).map(c => ({
      ...c,
      uf: inferirUf(c.uf, c.regiao),
    }));
  }, [consulta.dados?.campanhas]);

  const lista = useMemo(() => todasNormalizadas.filter(c =>
    (categoria === 'Todas' || c.categoria === categoria) &&
    (urgencia === 'Todas' || c.urgencia === urgencia) &&
    (verificacao === 'Todas' || !!c.verificada)
  ), [todasNormalizadas, categoria, urgencia, verificacao]);

  const filtrada = useMemo(() => lista.filter(c =>
    (uf === 'Todos' || c.uf === uf) &&
    (regiao === 'Brasil' || (!!c.uf && regioes[regiao].includes(c.uf)))
  ), [lista, uf, regiao]);

  const centro = zoom > 1 && uf !== 'Todos' ? estados.find(e => e.uf === uf) : null;
  const tamanho = 420 / zoom;
  const viewBoxX = (centro?.x || 210) - tamanho / 2 + pan.x;
  const viewBoxY = (centro?.y || 210) - tamanho / 2 + pan.y;

  const campanhasHover = hoverUf ? lista.filter(c => c.uf === hoverUf) : [];

  const selecionarEstado = (sigla: string) => {
    if (moveuDuranteArrasto.current) return;
    if (uf === sigla) {
      definirUf('Todos');
      definirZoom(1);
      definirPan({ x: 0, y: 0 });
    } else {
      definirUf(sigla);
      definirZoom(2.3);
      definirPan({ x: 0, y: 0 });
    }
  };

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(todasNormalizadas.map(c => c.categoria));
    return ['Todas', ...Array.from(cats)];
  }, [todasNormalizadas]);

  return (
    <Screen
      title="Mapa solidário"
      heading="Onde podemos somar."
      subtitle="Acompanhe cada campanha no mapa do Brasil por cidade, urgência e estado."
    >
      <EstadoConexao {...consulta}/>

      {/* Barra de Status e Contadores Dinâmicos */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.gentle,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }}/>
          <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.ink }}>
            {lista.length} {lista.length === 1 ? 'campanha mapeada' : 'campanhas mapeadas'}
          </Text>
        </View>

        {uf !== 'Todos' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              definirUf('Todos');
              definirZoom(1);
              definirPan({ x: 0, y: 0 });
            }}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.surface,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.line,
            }, pressed && s.pressed]}
          >
            <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 12, color: colors.primary }}>
              Estado: {uf}
            </Text>
            <Ionicons name="close-circle" size={16} color={colors.primary}/>
          </Pressable>
        ) : (
          <Text style={{ fontSize: 12, color: colors.muted }}>
            🔍 Clique em um estado ou bolinha para focar
          </Text>
        )}
      </View>

      {/* Container Interativo do Mapa com Drag Suave e Zoom */}
      <View
        ref={containerRef}
        {...gestoMobile.panHandlers}
        style={[{
          height: 450,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: colors.brandSoft,
          borderWidth: 1,
          borderColor: colors.line,
          position: 'relative',
        }, Platform.OS === 'web' ? ({
          cursor: arrastando ? 'grabbing' : 'grab',
          userSelect: 'none',
        } as any) : undefined]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`${viewBoxX} ${viewBoxY} ${tamanho} ${tamanho}`}
          accessibilityLabel="Mapa do Brasil com cidades e campanhas solidárias"
        >
          {/* 1. Camada dos Estados (Polígonos com Hover & Destaque) */}
          {estados.map(e => {
            const ativo = regioes[regiao].includes(e.uf);
            const selecionado = e.uf === uf;
            const emHover = e.uf === hoverUf;

            let fillPath = ativo ? colors.surface : colors.line;
            if (selecionado) fillPath = colors.primary;
            else if (emHover && ativo) fillPath = colors.gentle;

            return (
              <G
                key={e.uf}
                onPress={() => selecionarEstado(e.uf)}
                {...(Platform.OS === 'web' ? {
                  onMouseEnter: () => definirHoverUf(e.uf),
                  onMouseLeave: () => definirHoverUf(null),
                  style: { cursor: 'pointer', transition: 'fill 0.15s ease' }
                } : {})}
              >
                <Path
                  d={e.path}
                  fill={fillPath}
                  stroke={selecionado ? colors.hero : colors.muted}
                  strokeWidth={selecionado ? 1.4 : emHover ? 1.0 : 0.6}
                />
              </G>
            );
          })}

          {/* 2. Camada das Bolinhas das Campanhas e Cidades */}
          {estados.map(e => {
            const campanhasDoEstado = lista.filter(c => c.uf === e.uf);
            const ativo = regioes[regiao].includes(e.uf);
            if (!ativo || campanhasDoEstado.length === 0) return null;

            return campanhasDoEstado.map((campanha, idx) => {
              const pos = calcularPosicaoCampanha(e.x, e.y, campanha, idx, campanhasDoEstado.length);
              const critica = campanha.urgencia === 'Crítica' && !!campanha.verificada;
              const cor = critica ? colors.accent : colors.primary;
              const emFoco = hoverCampanha?.id === campanha.id;

              return (
                <G
                  key={campanha.id}
                  onPress={() => {
                    if (moveuDuranteArrasto.current) return;
                    roteador.push({ pathname: '/campanha', params: { id: campanha.id } });
                  }}
                  {...(Platform.OS === 'web' ? {
                    onMouseEnter: () => {
                      definirHoverCampanha(campanha);
                      definirHoverUf(e.uf);
                    },
                    onMouseLeave: () => definirHoverCampanha(null),
                    style: { cursor: 'pointer' }
                  } : {})}
                >
                  {/* Halo de destaque / pulso suave */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={emFoco ? 11 : 7.5}
                    fill={cor}
                    opacity={emFoco ? 0.45 : 0.22}
                  />
                  {/* Bolinha principal */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={emFoco ? 5.5 : 4.2}
                    fill={cor}
                    stroke={colors.surface}
                    strokeWidth={1.4}
                  />
                  {/* Núcleo central brilhante */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={emFoco ? 2.2 : 1.6}
                    fill="#FFFFFF"
                    opacity={0.9}
                  />
                </G>
              );
            });
          })}

          {/* 3. Camada de Texto das Siglas perfeitamente centralizadas */}
          {estados.map(e => {
            const ativo = regioes[regiao].includes(e.uf);
            const selecionado = e.uf === uf;

            return (
              <G
                key={`label-${e.uf}`}
                onPress={() => selecionarEstado(e.uf)}
                {...(Platform.OS === 'web' ? {
                  style: { pointerEvents: 'none' }
                } : {})}
              >
                <SvgText
                  x={e.x}
                  y={e.y}
                  fontSize={e.uf === 'DF' || e.uf === 'SE' ? 6 : 7.5}
                  fontWeight={selecionado ? 'bold' : '700'}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  
                  fill={selecionado ? colors.onHero : ativo ? colors.ink : colors.muted}
                  stroke={selecionado ? 'none' : colors.surface}
                  strokeWidth={selecionado ? 0 : 0.6}
                >
                  {e.uf}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* HUD Superior Dinâmico (Card Flutuante de Detalhes) */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 84,
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: hoverCampanha?.urgencia === 'Crítica' && hoverCampanha.verificada ? colors.accent : colors.primary,
            }}
          />
          <View style={{ flex: 1 }}>
            {hoverCampanha ? (
              <>
                <Text numberOfLines={1} style={{ fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.ink }}>
                  {hoverCampanha.titulo}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
                  📍 {hoverCampanha.regiao || 'Cidade cadastrada'} ({hoverCampanha.uf}) · {hoverCampanha.categoria} · Toque para abrir →
                </Text>
              </>
            ) : hoverUf || uf !== 'Todos' ? (
              <>
                <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.ink }}>
                  Estado: <Text style={{ color: colors.primary }}>{hoverUf || uf}</Text> · {(hoverUf ? campanhasHover : filtrada).length} campanha(s)
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {hoverUf === uf ? 'Clique para desmarcar' : 'Clique para aproximar neste estado'}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.ink }}>
                  Visão Geral do Brasil
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {Platform.OS === 'web' ? '🖱️ Arraste para mover · Roda do mouse para zoom' : '👆 Arraste e faça pinça para zoom'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Controles Flutuantes de Zoom e Recentralização */}
        <View
          style={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            flexDirection: 'column',
            gap: 6,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 6,
            borderWidth: 1,
            borderColor: colors.line,
            shadowColor: '#000',
            shadowOpacity: 0.14,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aproximar zoom"
            onPress={() => definirZoom(z => Math.min(4.8, Math.round((z + 0.4) * 10) / 10))}
            style={({ pressed }) => [{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: colors.gentle,
              alignItems: 'center',
              justifyContent: 'center',
            }, pressed && s.pressed]}
          >
            <Ionicons name="add" size={22} color={colors.primary}/>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Afastar zoom"
            onPress={() => definirZoom(z => Math.max(1, Math.round((z - 0.4) * 10) / 10))}
            style={({ pressed }) => [{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: colors.gentle,
              alignItems: 'center',
              justifyContent: 'center',
            }, pressed && s.pressed]}
          >
            <Ionicons name="remove" size={22} color={colors.primary}/>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Centralizar mapa"
            onPress={() => {
              definirZoom(1);
              definirPan({ x: 0, y: 0 });
              definirUf('Todos');
            }}
            style={({ pressed }) => [{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: colors.gentle,
              alignItems: 'center',
              justifyContent: 'center',
            }, pressed && s.pressed]}
          >
            <Ionicons name="scan-outline" size={18} color={colors.primary}/>
          </Pressable>
        </View>

        {/* Legenda Discreta no Canto Inferior Esquerdo */}
        <View
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }}/>
            <Text style={{ fontSize: 11, color: colors.ink, fontFamily: 'Manrope-SemiBold' }}>Campanha</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent }}/>
            <Text style={{ fontSize: 11, color: colors.ink, fontFamily: 'Manrope-SemiBold' }}>Urgência crítica</Text>
          </View>
        </View>
      </View>

      {/* Chips Rápidos de Categorias */}
      <View style={{ marginTop: 2 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {categoriasDisponiveis.map(cat => {
            const selecionada = categoria === cat;
            const contagem = cat === 'Todas' ? todasNormalizadas.length : todasNormalizadas.filter(c => c.categoria === cat).length;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                onPress={() => definirCategoria(cat)}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selecionada ? colors.primary : colors.gentle,
                  borderWidth: 1,
                  borderColor: selecionada ? colors.primary : colors.line,
                }, pressed && s.pressed]}
              >
                <Text style={{
                  fontFamily: 'Manrope-SemiBold',
                  fontSize: 12,
                  color: selecionada ? colors.onHero : colors.ink,
                }}>
                  {cat}
                </Text>
                <View
                  style={{
                    backgroundColor: selecionada ? 'rgba(255,255,255,0.25)' : colors.surface,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: selecionada ? '#FFFFFF' : colors.muted,
                  }}>
                    {contagem}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Disclosure title="Filtros avançados (região, urgência e auditoria)">
        <Choices label="Região do Brasil" options={Object.keys(regioes)} selected={regiao} onSelect={r => { definirRegiao(r); definirUf('Todos'); }}/>
        <Choices label="Urgência" options={['Todas', 'Crítica', 'Moderada', 'Regular']} selected={urgencia} onSelect={definirUrgencia}/>
        <Choices label="Verificação" options={['Todas', 'Verificação vigente']} selected={verificacao} onSelect={definirVerificacao}/>
        <Choices label="Selecionar estado diretamente" options={['Todos', ...regioes[regiao]]} selected={uf} onSelect={u => { definirUf(u); definirPan({ x: 0, y: 0 }); }}/>
      </Disclosure>

      {/* Resumo e lista de causas filtradas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <Text style={{ fontFamily: 'Sora-SemiBold', fontSize: 18, color: colors.ink }}>
          {uf === 'Todos' ? regiao : `Campanhas em ${uf}`}
        </Text>
        <Tag>{`${filtrada.length} ${filtrada.length === 1 ? 'campanha' : 'campanhas'}`}</Tag>
      </View>

      {filtrada.map(c => (
        <Card
          key={c.id}
          title={c.titulo}
          subtitle={`${c.regiao ? `${c.regiao} · ` : ''}${c.uf || 'UF'} · ${c.categoria} · ${c.urgencia}${c.verificada ? ' · verificada' : ''}`}
          onPress={() => roteador.push({ pathname: '/campanha', params: { id: c.id } })}
        />
      ))}

      {!consulta.carregando && !consulta.erro && !filtrada.length ? (
        <EmptyState title="Nenhuma campanha nesta seleção.">
          Experimente outro estado ou filtro. A ausência de cadastros não significa ausência de necessidades.
        </EmptyState>
      ) : null}

      <Disclosure title="Sobre este mapa solidário">
        <Copy muted>{consulta.dados?.aviso}</Copy>
        <Copy muted>
          Malha geográfica do Brasil. Os pontos representam as campanhas cadastradas nas cidades e estados com localização aproximada, integrando dados em tempo real ao banco local.
        </Copy>
      </Disclosure>
    </Screen>
  );
}
