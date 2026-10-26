import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Copy, Dialog, Disclosure, Notice, Progress, Screen, useTheme } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { FotoDeCampanha } from '../components/fotos';
import { ImagemPrivada, ImagemPublica } from '../components/arquivos';
import { BotaoCompartilhar } from '../components/solidariedade';
import { useDados, usuarioLogado, requisitar, type Campanha, type Necessidade } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
export function DetalheCampanha(){
 const r=useRouter(),{id}=useLocalSearchParams<{id?:string}>(),identificador=id||'familia',q=useDados<Campanha>('/campanhas/'+identificador),c=q.dados,{colors,fontsReady}=useTheme(),[escolher,setEscolher]=useState(false);
 useEffect(()=>{void requisitar('/campanhas/'+identificador+'/visualizacao','POST').catch(()=>{});},[identificador]);
 const propria=c?.usuario_id===usuarioLogado()?.id,financeiras=c?.necessidades.filter(n=>n.tipo==='dinheiro')||[],meta=financeiras.reduce((s,n)=>s+n.meta,0),confirmado=financeiras.reduce((s,n)=>s+n.recebido,0),pedidos=c?.necessidades.filter(n=>n.tipo==='dinheiro'&&n.tipo_meta==='aberta'||n.meta>n.recebido+Number(n.reservado))||[];
 function abrir(n:Necessidade){setEscolher(false);r.push({pathname:n.tipo==='dinheiro'?'/doacao':n.tipo==='tarefa'?'/voluntariado':'/contribuir',params:{id:n.id}});}
 function ajudar(){const financeiros=pedidos.filter(n=>n.tipo==='dinheiro');if(financeiros.length===1)abrir(financeiros[0]);else if(pedidos.length===1)abrir(pedidos[0]);else setEscolher(true);}
 return <Screen title="Campanha"><EstadoConexao {...q}/>{c?<>
 <View style={{height:230,borderRadius:24,overflow:'hidden',backgroundColor:colors.soft}}>{c.imagem_id?['ativa','encerrada'].includes(c.estado)?<ImagemPublica id={c.imagem_id} altura={230}/>:<ImagemPrivada id={c.imagem_id} altura={230}/>:<FotoDeCampanha campanhaId={c.id} categoria={c.categoria} height={230}/>}</View>
 <View style={{gap:10}}><Text accessibilityRole="header" style={{fontSize:26,lineHeight:35,color:colors.ink,fontFamily:fontsReady?'Sora-SemiBold':undefined}}>{c.titulo}</Text>{c.regiao?<View style={{flexDirection:'row',gap:6,alignItems:'center'}}><Ionicons aria-hidden accessible={false} name="location-outline" color={colors.primary} size={17}/><Text style={{color:colors.muted,fontSize:13,flex:1,lineHeight:21}}>{c.regiao}</Text></View>:null}{c.urgencia?.revisada?<Text style={{fontSize:13,color:colors.primary,lineHeight:21}}>Urgência {c.urgencia.classe==='critica'?'crítica':'moderada'} com revisão vigente</Text>:null}</View>
 {meta>0?<View style={{gap:8}}><Text style={{fontSize:24,lineHeight:34,color:colors.ink,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>{formatarDinheiro(confirmado/100)} <Text style={{fontSize:14,color:colors.muted}}>de {formatarDinheiro(meta/100)}</Text></Text><Progress done={confirmado} total={meta}/><Text style={{fontSize:12,color:colors.muted,lineHeight:20}}>Doações e valores desta versão são simulados.</Text></View>:null}
 <Copy>{c.descricao.length>230?c.descricao.slice(0,230).trim()+'…':c.descricao}</Copy>
 {propria?<Button title="Cuidar da minha campanha" onPress={()=>r.push({pathname:'/gerenciar',params:{id:c.id}})}/>:c.estado==='ativa'&&pedidos.length?<Button title={financeiras.length?'Fazer doação':'Quero ajudar'} onPress={ajudar}/>:<Notice>Esta campanha não recebe novas ajudas agora. O histórico continua disponível.</Notice>}
 {['ativa','encerrada'].includes(c.estado)?<BotaoCompartilhar id={c.id} titulo={c.titulo}/>:null}
 {c.descricao.length>230?<Disclosure title="Ler a história completa"><Copy>{c.descricao}</Copy></Disclosure>:null}
 <View style={{padding:16,borderRadius:18,borderWidth:1,borderColor:colors.line,gap:8}}><Text style={{fontSize:12,color:colors.muted}}>Organizada por</Text><Text style={{fontSize:16,lineHeight:24,color:colors.ink,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>{c.responsavel}</Text>{c.perfil_publico?<Button secondary title="Conhecer quem organiza" onPress={()=>r.push({pathname:'/perfil-publico',params:{id:String(c.usuario_id)}})}/>:null}</View>
 <Disclosure title="Outras formas de ajudar">{c.necessidades.map(n=><Card key={n.id} title={n.nome} subtitle={n.tipo==='dinheiro'?formatarDinheiro(n.recebido/100)+' de '+formatarDinheiro(n.meta/100):n.recebido+' de '+n.meta+' confirmados'} onPress={()=>r.push({pathname:'/necessidade',params:{id:n.id}})}/>)}</Disclosure>
 <Disclosure title="Atualizações e transparência"><Button secondary title="Contribuições e progresso" onPress={()=>r.push({pathname:'/rota',params:{id:c.id}})}/><Button secondary title="Atualizações da campanha" onPress={()=>r.push({pathname:'/atualizacoes',params:{campanha:c.id}})}/><Button secondary title="Resultado e impacto" onPress={()=>r.push({pathname:'/resultado',params:{id:c.id}})}/>{c.evento?<Button secondary title="Evento desta campanha" onPress={()=>r.push({pathname:'/acao',params:{id:c.id}})}/>:null}<Copy muted>{c.prazo?'Prazo desejado: '+c.prazo:'Sem prazo definido.'}</Copy></Disclosure>
 <Button secondary title="Denunciar campanha" onPress={()=>r.push({pathname:'/denunciar',params:{id:c.id}})}/>
 <Dialog visible={escolher} title="Como você quer ajudar?" onClose={()=>setEscolher(false)}>{pedidos.map(n=><Card key={n.id} title={n.nome} subtitle={n.tipo==='dinheiro'?'Doação de demonstração':n.tipo==='tarefa'?'Participe com seu tempo':'Contribua com objetos'} onPress={()=>abrir(n)}/>)}{!pedidos.length?<Copy>As metas já foram atendidas.</Copy>:null}</Dialog>
 </>:null}</Screen>;
}
