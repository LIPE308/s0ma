import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { PanResponder, Switch, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Button, Card, Choices, Copy, Dialog, EmptyState, Heading, Line, Screen, Tag, useTheme } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { useDados } from '../servicos/api';
import { formatarDinheiro, categorias } from '../data/formatacao';
import type { MapaDados } from '../servicos/soma2';
import cartografia from '../data/mapa-brasil.json';

export function MapaSolidario(){
  const router=useRouter(),{colors}=useTheme();
  const [uf,setUf]=useState(''),[categoria,setCategoria]=useState('Todas'),[cidade,setCidade]=useState('Todos'),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[arrastar,setArrastar]=useState(false);
  const [filtros,setFiltros]=useState(false);
  const consulta=useDados<MapaDados>('/mapa'+(categoria==='Todas'?'':'?categoria='+encodeURIComponent(categoria)));
  const selecionado=consulta.dados?.estados.find(e=>e.uf===uf),campanhas=selecionado?.campanhas.filter(c=>cidade==='Todos'||c.municipio===cidade)||[];
  const nomes=new Map(cartografia.estados.map(e=>[e.uf,e.nome]));
  const posicao=useRef(pan),inicio=useRef(pan);
  useEffect(()=>{posicao.current=pan;},[pan]);
  const gesto=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>arrastar&&(Math.abs(g.dx)>10||Math.abs(g.dy)>10),onPanResponderGrant:()=>{inicio.current=posicao.current;},onPanResponderMove:(_,g)=>setPan({x:Math.max(-220,Math.min(220,inicio.current.x+g.dx*1.4)),y:Math.max(-220,Math.min(220,inicio.current.y+g.dy*1.4))})}),[arrastar]);
  function selecionar(valor:string){setUf(valor);setCidade('Todos');}
  return <Screen title="Mapa Solidário" heading="O cuidado tem muitos lugares." subtitle="Descubra causas por estado, sem expor endereços particulares.">
    <Button secondary title={'Categoria: '+categoria} onPress={()=>setFiltros(true)}/>
    <EstadoConexao {...consulta}/>
    <View {...gesto.panHandlers} style={{borderRadius:28,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,overflow:'hidden'}}>
      <Svg viewBox={(-pan.x)+' '+(-pan.y)+' '+600/zoom+' '+580/zoom} width="100%" height={380} accessibilityLabel="Mapa do Brasil agregado por estado. Selecione também pela lista de estados abaixo.">
        <G>
          {cartografia.estados.map(e=><Path key={e.uf} d={e.caminho} fill={uf===e.uf?colors.brandSoft:colors.soft} stroke={uf===e.uf?colors.primary:colors.muted} strokeOpacity={uf===e.uf?1:.5} strokeWidth={uf===e.uf?2.5:1.2} onPress={()=>selecionar(e.uf)}/>)}
          {consulta.dados?.estados.map(e=>{const ponto=cartografia.estados.find(p=>p.uf===e.uf);if(!ponto)return null;const raio=Math.min(30,8+Math.sqrt(e.intensidade)*3);return <G key={e.uf} onPress={()=>selecionar(e.uf)}><Circle cx={ponto.x} cy={ponto.y} r={raio+8} fill={colors.primary} opacity={.12}/><Circle cx={ponto.x} cy={ponto.y} r={raio} fill={colors.primary} opacity={.28}/><Circle cx={ponto.x} cy={ponto.y} r={4} fill={colors.primary}/><SvgText x={ponto.x+7} y={ponto.y-8} fill={colors.ink} fontSize={12} fontWeight="600">{e.uf}</SvgText></G>;})}
        </G>
      </Svg>
      <View style={{padding:16,gap:10}}><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary title="Aproximar mapa" disabled={zoom>=2} onPress={()=>setZoom(z=>Math.min(2,z+.25))}/></View><View style={{flex:1}}><Button secondary title="Afastar mapa" disabled={zoom<=1} onPress={()=>{setZoom(z=>Math.max(1,z-.25));setPan({x:0,y:0});}}/></View></View><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Switch accessibilityLabel="Ativar movimentação do mapa" value={arrastar} onValueChange={setArrastar}/><Copy>Arrastar para movimentar</Copy></View>{zoom>1?<Button secondary title="Centralizar o Brasil" onPress={()=>{setZoom(1);setPan({x:0,y:0});}}/>:null}<Copy muted>Círculos maiores indicam mais intensidade calculada nas campanhas autorizadas, não maior necessidade social da população.</Copy></View>
    </View>
    <Copy muted>Cartografia: IBGE, malhas simplificadas por UF. A navegação não consulta GPS nem envia sua localização.</Copy>
    <Heading>Escolha um estado</Heading><Choices label="Estado" options={cartografia.estados.map(e=>e.uf)} selected={uf} onSelect={selecionar}/>
    {consulta.dados&&!consulta.dados.estados.length?<EmptyState title="O mapa começa com consentimento.">Ainda não há campanhas ativas com localização autorizada nesta seleção. Responsáveis podem informar apenas estado e município na preparação da campanha.</EmptyState>:null}
    {uf?<><Heading>{nomes.get(uf)||uf}</Heading>{selecionado?<><Line label="Campanhas registradas" value={String(selecionado.campanhas.length)}/><Line label="Críticas com revisão vigente" value={String(selecionado.criticas)}/><Line label="Moderadas revisadas" value={String(selecionado.moderadas)}/><Line label="Restante financeiro simulado" value={formatarDinheiro(selecionado.restante/100)}/><Choices label="Município aproximado" options={['Todos',...new Set(selecionado.campanhas.map(c=>c.municipio).filter(Boolean))]} selected={cidade} onSelect={setCidade}/>{campanhas.map(c=><Card key={c.id} title={c.titulo} subtitle={(c.municipio||uf)+' · '+formatarDinheiro(c.restante/100)+' restantes no teste'} icon="heart-outline" onPress={()=>router.push({pathname:'/campanha',params:{id:c.id}})}>{c.urgencia.revisada?<Tag>Urgência {c.urgencia.classe==='critica'?'crítica':'moderada'} revisada</Tag>:null}</Card>)}</>:<EmptyState title="Sem campanhas autorizadas neste estado.">Você pode escolher outro estado ou categoria.</EmptyState>}</>:<Copy>Toque no mapa ou em uma UF para conhecer as campanhas.</Copy>}
    <Card title="Como a intensidade é calculada"><Copy muted>{consulta.dados?.indicador||'O indicador considera urgência revisada, prazo e recursos ainda necessários nas campanhas cadastradas.'}</Copy></Card>
    <Dialog visible={filtros} title="Categoria no mapa" onClose={()=>setFiltros(false)}><Choices label="Categoria no mapa" options={['Todas',...categorias]} selected={categoria} onSelect={v=>{setCategoria(v);setCidade('Todos');}}/><Button title="Ver mapa filtrado" onPress={()=>setFiltros(false)}/></Dialog>
  </Screen>;
}
