import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button, Card, Copy, Dialog, EmptyState, Field, Heading, Line, Notice, Progress, Screen, Tag, useTheme } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { useDados, type Campanha } from '../servicos/api';
import { formatarDinheiro, converterValor } from '../data/formatacao';
import { EntryMotion, MotionPressable } from '../design/motion';
import type { Marco, Rota } from '../servicos/soma2';

const moeda=(centavos:number)=>formatarDinheiro(centavos/100);
function Trilha({marcos}:{marcos:Marco[]}){
  const {colors,fontsReady}=useTheme(),[largura,setLargura]=useState(320),[selecionado,setSelecionado]=useState<Marco|null>(null);
  const passo=116,centro=(i:number)=>i%2===0?48:largura-48;
  return <><EntryMotion onLayout={e=>setLargura(e.nativeEvent.layout.width)} style={{height:marcos.length*passo+16,minWidth:0}}>
    <Svg width={largura} height={marcos.length*passo+16} style={{position:'absolute',top:0,left:0}} accessible={false}>
      {marcos.slice(1).map((m,i)=>{const y=i*passo+38,y2=(i+1)*passo+38;return <Path key={m.id} d={'M '+centro(i)+' '+y+' C '+centro(i)+' '+(y+58)+' '+centro(i+1)+' '+(y2-58)+' '+centro(i+1)+' '+y2} fill="none" stroke={marcos[i].concluido&&m.concluido?colors.primary:colors.line} strokeWidth={4} strokeDasharray={m.estado==='futuro'?'5 8':undefined}/>;})}
    </Svg>
    {marcos.map((m,i)=><View key={m.id} style={{position:'absolute',top:i*passo+10,left:0,right:0,height:94}}>
      <MotionPressable accessibilityRole="button" accessibilityLabel={m.titulo+'. '+(m.estado==='concluido'?'Concluído':m.estado==='atual'?'Etapa atual':'Etapa futura')+'. Abrir detalhes'} accessibilityState={{selected:m.estado==='atual'}} onPress={()=>setSelecionado(m)} containerStyle={{position:'absolute',left:centro(i)-28,top:0}} style={({pressed})=>({width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',backgroundColor:m.concluido?colors.primary:colors.surface,borderWidth:m.estado==='atual'?3:2,borderColor:m.estado==='futuro'?colors.line:colors.primary,opacity:pressed?.75:1})}>
        <Ionicons name={m.concluido?'checkmark':i===marcos.length-1?'star-outline':m.estado==='atual'?'footsteps-outline':'ellipse-outline'} size={25} color={m.concluido?colors.onPrimary:m.estado==='atual'?colors.primary:colors.muted}/>
      </MotionPressable>
      <Pressable accessibilityRole="button" accessibilityLabel={'Detalhes: '+m.titulo} onPress={()=>setSelecionado(m)} style={{position:'absolute',left:i%2===0?94:4,right:i%2===0?4:94,minHeight:56,justifyContent:'center',alignItems:i%2===0?'flex-start':'flex-end'}}>
        <Text style={{fontFamily:fontsReady?'Manrope-SemiBold':undefined,fontSize:16,lineHeight:23,color:m.estado==='futuro'?colors.muted:colors.ink,textAlign:i%2===0?'left':'right'}}>{m.titulo}</Text><Text style={{fontSize:12,lineHeight:20,color:colors.muted}}>{m.concluido?'Concluído':m.estado==='atual'?'Próximo passo':'Mais adiante'}</Text>
      </Pressable>
    </View>)}
  </EntryMotion><Dialog visible={!!selecionado} title={selecionado?.titulo||'Etapa'} onClose={()=>setSelecionado(null)}><Tag>{selecionado?.concluido?'Concluído':'Em construção'}</Tag><Copy>{selecionado?.detalhe}</Copy><Copy muted>Este marco acompanha os registros da campanha. Projeções nunca entram no valor confirmado.</Copy><Button title="Voltar à rota" onPress={()=>setSelecionado(null)}/></Dialog></>;
}
export function RotaInteligente(){
  const {id}=useLocalSearchParams<{id?:string}>(),router=useRouter(),{colors,fontsReady}=useTheme(),{width}=useWindowDimensions();
  const [cenario,setCenario]=useState(''),[taxa,setTaxa]=useState(''),[dias,setDias]=useState('30'),[custos,setCustos]=useState('0,00'),[erro,setErro]=useState('');
  const campanhas=useDados<Campanha[]>(!id?'/campanhas':null),consulta=useDados<Rota>(id?'/campanhas/'+id+'/rota'+cenario:null),rota=consulta.dados;
  function calcular(){const r=Number(taxa.replace(',','.')),d=Number(dias),c=Math.round(converterValor(custos)*100);if(!taxa.trim()||!Number.isFinite(r)||r<0||r>2||!Number.isInteger(d)||d<1||d>365||!Number.isSafeInteger(c)||c<0){setErro('Informe uma taxa hipotética de 0 a 2% ao mês, prazo de 1 a 365 dias e custos válidos.');return;}setErro('');setCenario('?taxa_mensal='+r+'&dias='+d+'&custos='+c);}
  return <Screen variant="ledger" title="Rota Inteligente" heading={id?undefined:'Toda ajuda encontra um caminho.'}>
    {!id?<><Copy>Acompanhe uma causa de marco em marco. Valores confirmados e possibilidades futuras ficam separados.</Copy><EstadoConexao {...campanhas}/>{campanhas.dados?.filter(c=>(c.meta_financeira||0)>0).map(c=><Card key={c.id} title={c.titulo} subtitle={moeda(c.recebido_financeiro||0)+' confirmados no teste · meta '+moeda(c.meta_financeira||0)} icon="footsteps-outline" onPress={()=>router.push({pathname:'/rota',params:{id:c.id}})}/>)}{campanhas.dados&&!campanhas.dados.some(c=>(c.meta_financeira||0)>0)?<EmptyState title="Uma nova rota pode começar.">Quando uma campanha tiver meta financeira, seu caminho aparecerá aqui.</EmptyState>:null}</>:<><EstadoConexao {...consulta}/>{rota?<>
      <View style={{borderRadius:28,backgroundColor:colors.hero,padding:24,gap:16}}>
        <View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons name="footsteps-outline" size={28} color={colors.onHero}/><Text style={{color:colors.onHero,fontSize:14,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>Uma jornada feita de pessoas</Text></View>
        <Text accessibilityRole="header" style={{fontFamily:fontsReady?'Sora-SemiBold':undefined,fontSize:27,lineHeight:36,color:colors.onHero}}>{rota.campanha.titulo}</Text>
        <Text style={{fontSize:38,lineHeight:48,color:colors.onHero,fontFamily:fontsReady?'Sora-SemiBold':undefined}}>{moeda(rota.confirmado)}</Text>
        <Text style={{color:colors.onHero,fontSize:16,lineHeight:24}}>confirmados no ambiente de simulação · {rota.percentual.toFixed(1).replace('.',',')}% da meta</Text>
        <Progress done={rota.confirmado} total={rota.meta} inverse/><Text style={{color:colors.onHero,fontSize:15}}>Meta {moeda(rota.meta)} · faltam {moeda(rota.restante)}</Text>
      </View>
      <Tag>Valores simulados · nenhum dinheiro real</Tag>{rota.campanha.estado!=='ativa'?<Notice>Esta campanha está fora de arrecadação ativa. O histórico confirmado permanece disponível.</Notice>:null}
      {rota.meta===0?<Notice>Esta campanha não tem meta financeira. Objetos e tarefas continuam com seu próprio acompanhamento.</Notice>:null}
      {rota.urgencia.revisada?<Tag>{rota.urgencia.classe==='critica'?'Urgência crítica revisada':'Urgência moderada revisada'}</Tag>:null}
      <View style={{flexDirection:width>=760?'row':'column',gap:24,alignItems:'stretch'}}>
        <View style={{flex:1,minWidth:0}}><Heading>Seu caminho até a meta</Heading><Copy muted>Toque em uma etapa para entender o que já aconteceu e o que vem pela frente.</Copy><Trilha marcos={rota.marcos}/></View>
        <View style={{width:width>=760?270:'100%',gap:18}}>
          <Card title="De onde vem cada valor" icon="heart-outline"><Line label="Doações confirmadas" value={moeda(rota.doacoes_confirmadas)}/><Line label="Créditos de anúncios" value={moeda(rota.anuncios_creditados)}/>{rota.saldo_legado!==0?<><Line label="Saldo histórico importado" value={moeda(rota.saldo_legado)}/><Copy muted>Registro anterior à Rota Inteligente. Não representa uma nova doação.</Copy></>:null}<Copy muted>{rota.quantidade_doacoes} doações confirmadas no teste.</Copy></Card>
          <Card title="Cada valor no seu lugar"><Line label="Confirmado na meta" value={moeda(rota.confirmado)}/><Line label="Disponível no teste" value={moeda(rota.disponivel)}/><Line label="Reservado em repasses" value={moeda(rota.reservado)}/><Line label="Já repassado no teste" value={moeda(rota.repassado)}/><Line label="Aplicado" value={moeda(rota.aplicado)}/><Line label="Rendimentos realizados" value={moeda(rota.rendimentos_realizados)}/><Copy muted>Não existe aplicação automática, custódia ou operação bancária.</Copy></Card>
        </View>
      </View>
      <Heading>Um horizonte, com transparência</Heading><Copy>{rota.projecao.estrategia}</Copy>{rota.projecao.alerta_prazo?<Notice>{rota.projecao.alerta_prazo}</Notice>:null}
      <Card title="Projeções futuras" icon="telescope-outline"><Line label="Novas doações em 30 dias" value={rota.projecao.doacoes?moeda(rota.projecao.doacoes.mensal):'Ainda indisponível'}/><Line label="Anúncios em 30 dias" value={rota.projecao.anuncios?moeda(rota.projecao.anuncios.mensal):'Ainda indisponível'}/><Line label="Prazo estimado até a meta" value={rota.projecao.dias_para_meta===null?'Ainda indisponível':rota.projecao.dias_para_meta===0?'Meta alcançada':rota.projecao.dias_para_meta+' dias'}/><Copy>{rota.projecao.mensagem}</Copy>{rota.projecao.doacoes?<Copy muted>{rota.projecao.doacoes.amostras} registros em {rota.projecao.doacoes.dias} dias. {rota.projecao.doacoes.hipotese}</Copy>:<Copy muted>A estimativa exige pelo menos 3 doações em dias distintos, ao longo de 7 dias. Nenhum valor é inventado quando falta histórico.</Copy>}{rota.projecao.anuncios?<Copy muted>{rota.projecao.anuncios.hipotese}</Copy>:null}</Card>
      <Card title="Explore uma hipótese educativa"><Copy muted>Informe sua própria hipótese. Nenhum produto é recomendado e nenhuma aplicação será realizada. A taxa não é uma oferta ou promessa.</Copy><Field label="Taxa hipotética mensal (%)" value={taxa} numeric onChangeText={setTaxa} placeholder="Informe uma hipótese"/><Field label="Prazo da hipótese, em dias" value={dias} numeric onChangeText={setDias}/><Field label="Custos hipotéticos em reais" value={custos} numeric onChangeText={setCustos}/>{erro?<Notice error>{erro}</Notice>:null}<Button secondary title="Calcular cenário educativo" onPress={calcular}/>{rota.projecao.educativa?rota.projecao.educativa.bloqueada?<Notice>{rota.projecao.educativa.motivo}</Notice>:<><Line label="Resultado potencial da hipótese" value={moeda(rota.projecao.educativa.resultado||0)}/><Copy muted>{rota.projecao.educativa.hipotese}</Copy></>:null}</Card>
      <AnuncioSolidario/>
      <Button title="Ver campanha e suas necessidades" onPress={()=>router.push({pathname:'/campanha',params:{id:rota.campanha.id}})}/><Button secondary title="Atualizar a rota" onPress={consulta.atualizar}/>
    </>:null}</>}
  </Screen>;
}
export function AnuncioSolidario(){
  const router=useRouter(),{colors}=useTheme();
  return <View style={{padding:20,gap:12,borderRadius:22,borderWidth:1,borderColor:colors.line,backgroundColor:colors.gentle}}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons name="leaf-outline" size={24} color={colors.gentleInk}/><Text style={{fontSize:16,color:colors.gentleInk,fontWeight:'600'}}>Os anúncios também ajudam.</Text></View><Copy>Parte da receita gerada aqui é destinada a campanhas que mais precisam.</Copy><Copy muted>Espaço preparado para anúncios. Sem provedor ativo: esta área não gera receita nem créditos por visualização. O fundo atual é uma simulação administrativa.</Copy><Button secondary title="Entenda o fundo solidário" onPress={()=>router.push('/transparencia-anuncios')}/></View>;
}
