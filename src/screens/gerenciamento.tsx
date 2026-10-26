import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Copy, Dialog, Disclosure, Field, Notice, Screen, useTheme } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { ImagemPrivada } from '../components/arquivos';
import { FotoDeCampanha } from '../components/fotos';
import { BotaoCompartilhar, CartaoAnuncios, ResumoArrecadacao } from '../components/solidariedade';
import { useDados, usuarioLogado, requisitar, mensagemErro, type Campanha } from '../servicos/api';
import type { Rota } from '../servicos/soma2';
import { parametrosDaCampanha } from './creation';
import { formatarDinheiro } from '../data/formatacao';
export function Gerenciar(){
 const r=useRouter(),{id,salvo}=useLocalSearchParams<{id?:string;salvo?:string}>(),p=usuarioLogado(),q=useDados<Campanha>(id&&p?'/campanhas/'+id:null),c=q.dados,rota=useDados<Rota>(id&&p?'/campanhas/'+id+'/rota':null),{colors}=useTheme();
 const [janela,setJanela]=useState(false),[motivo,setMotivo]=useState(''),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false),permitido=c&&p&&(c.usuario_id===p.id||p.administrador);
 async function encerrar(){setOcupado(true);setErro('');try{await requisitar('/campanhas/'+id+'/encerrar','PATCH',{motivo});setJanela(false);q.atualizar();rota.atualizar();}catch(e){setErro(mensagemErro(e));}finally{setOcupado(false);}}
 const situacao=c?.estado==='rascunho'?c.submetida?'Em análise':'Em preparação':c?.estado==='ativa'?'Campanha publicada':c?.estado==='encerrada'?'Campanha encerrada':c?.estado==='ajustes'?'Ajustes solicitados':'Campanha suspensa';
 return <Screen title="Minha campanha"><EstadoConexao {...q}/>{!p?<PedirLogin/>:!id?<Notice>Escolha uma campanha no seu perfil.</Notice>:c&&!permitido?<Notice>Somente o responsável pode gerenciar esta campanha.</Notice>:c?<>
 {salvo?<Notice success>{salvo==='enviada'?'Campanha enviada. Você pode acompanhar a análise por aqui.':'Rascunho salvo. Continue no seu ritmo.'}</Notice>:null}
 <View style={{height:190,borderRadius:24,overflow:'hidden'}}>{c.imagem_id?<ImagemPrivada id={c.imagem_id} altura={190}/>:<FotoDeCampanha campanhaId={c.id} categoria={c.categoria} height={190}/>}</View>
 <View style={{gap:8}}><Copy muted>{situacao}</Copy><Text accessibilityRole="header" style={{fontSize:23,lineHeight:32,fontWeight:'600',color:colors.ink}}>{c.titulo}</Text></View>
 {rota.dados&&rota.dados.meta>0?<><ResumoArrecadacao rota={rota.dados}/><CartaoAnuncios rota={rota.dados}/></>:null}
 {c.estado==='ativa'||c.estado==='encerrada'?<BotaoCompartilhar id={c.id} titulo={c.titulo} principal/>:<Button title={c.submetida?'Acompanhar análise':'Preparar envio para análise'} onPress={()=>r.push({pathname:'/preparar-campanha',params:{id:c.id}})}/>}
 <Button secondary title="Editar campanha" onPress={()=>r.push({pathname:'/criar',params:parametrosDaCampanha(c)})}/>
 <Disclosure title="Contribuições e progresso"><Button secondary title="Ver contribuições e progresso" onPress={()=>r.push({pathname:'/rota',params:{id:c.id}})}/><Button secondary title="Confirmar ajudas recebidas" onPress={()=>r.push({pathname:'/confirmar',params:{campanha:c.id}})}/>{c.necessidades.map(n=><Card key={n.id} title={n.nome} subtitle={n.tipo==='dinheiro'?formatarDinheiro(n.recebido/100)+' de '+formatarDinheiro(n.meta/100):n.recebido+' de '+n.meta+' confirmados'}/>)}{rota.dados?.meta?<Button secondary title="Registros financeiros de teste" onPress={()=>r.push({pathname:'/saldo',params:{campanha:c.id}})}/>:null}</Disclosure>
 <Disclosure title="Fotos, documentos e prioridade"><Button secondary title="Foto e documentos privados" onPress={()=>r.push({pathname:'/preparar-campanha',params:{id:c.id}})}/><Button secondary title="Solicitar análise de urgência" onPress={()=>r.push({pathname:'/urgencia',params:{id:c.id}})}/><Copy muted>A prioridade é atribuída após análise humana de evidências. Enviar documentos não garante urgência.</Copy></Disclosure>
 <Disclosure title="Atualizações e outras ferramentas"><Button secondary title="Ver página da campanha" onPress={()=>r.push({pathname:'/campanha',params:{id:c.id}})}/><Button secondary title="Publicar atualização" onPress={()=>r.push({pathname:'/publicar',params:{campanha:c.id}})}/><Button secondary title="Resultado e impacto" onPress={()=>r.push({pathname:'/resultado',params:{id:c.id}})}/><Button secondary title="Adicionar outra necessidade" onPress={()=>r.push({pathname:'/editar-necessidade',params:parametrosDaCampanha(c)})}/></Disclosure>
 <Disclosure title="Situação da campanha">{c.motivo?<Copy>{c.motivo}</Copy>:null}{c.estado==='ativa'?<Button danger title="Encerrar campanha" onPress={()=>setJanela(true)}/>:c.estado==='encerrada'?<><Copy>O histórico é preservado. A reabertura depende de revisão das metas e nova análise.</Copy><Button title="Revisar metas e reabrir" onPress={()=>r.push({pathname:'/criar',params:{...parametrosDaCampanha(c),reabrir:'1'}})}/></>:<Copy>A campanha não recebe contribuições enquanto não estiver publicada.</Copy>}</Disclosure>
 </>:null}
 <Dialog visible={janela} title="Encerrar esta campanha?" onClose={()=>setJanela(false)}><Copy>Novas contribuições ficam bloqueadas. O histórico continua disponível.</Copy><Field label="Motivo do encerramento" multiline value={motivo} onChangeText={setMotivo}/>{erro?<Notice error>{erro}</Notice>:null}<Button danger title="Confirmar encerramento" disabled={ocupado||!motivo.trim()} onPress={encerrar}/></Dialog>
 </Screen>;
}
