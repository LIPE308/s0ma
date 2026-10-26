import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, Switch, Text, View } from 'react-native';
import { Button, Card, Choices, Copy, Field, Heading, Notice, Screen, Tag, useTheme } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { ImagemPrivada, ImagemPublica, EnviarArquivo } from '../components/arquivos';
import { requisitar, guardarSessao, useDados, usuarioLogado, mensagemErro, type Usuario } from '../servicos/api';
import { destinoDaSessao } from '../servicos/acesso';
import type { Configuracao, PerfilAmpliado } from '../servicos/soma2';

export function RetratoPerfil(){
  const router=useRouter(),{colors,fontsReady}=useTheme(),consulta=useDados<PerfilAmpliado>(usuarioLogado()?'/perfil-ampliado':null),p=consulta.dados;
  if(!p)return <EstadoConexao {...consulta}/>;
  const tom=p.cor==='verde'?colors.gentle:p.cor==='terracota'?colors.soft:colors.brandSoft;
  return <View style={{borderRadius:28,overflow:'hidden',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line}}>
    {p.capa_id?<ImagemPrivada id={p.capa_id} altura={140}/>:<View style={{height:110,backgroundColor:tom,justifyContent:'center',padding:24}}><Ionicons name="leaf-outline" size={42} color={colors.primary}/></View>}
    <View style={{padding:22,gap:16}}>
      <View style={{flexDirection:'row',gap:16,alignItems:'center'}}><View style={{width:72,height:72,borderRadius:36,overflow:'hidden',backgroundColor:colors.brandSoft,justifyContent:'center',alignItems:'center'}}>{p.avatar_id?<ImagemPrivada id={p.avatar_id} altura={72}/>:p.usar_foto_google&&p.foto_google?<Image source={{uri:p.foto_google}} style={{width:72,height:72}} accessibilityLabel="Sua foto Google autorizada"/>:<Text style={{fontSize:30,color:colors.primary,fontFamily:fontsReady?'Sora-SemiBold':undefined}}>{p.nome[0]?.toUpperCase()}</Text>}</View><View style={{flex:1,gap:4}}><Text accessibilityRole="header" style={{fontFamily:fontsReady?'Sora-SemiBold':undefined,fontSize:23,lineHeight:31,color:colors.ink}}>{p.tipo==='instituicao'?p.nome_instituicao:p.nome}</Text><Text style={{fontSize:14,color:colors.muted}}>{p.tipo==='instituicao'?'Instituição · responsável '+p.nome:'Uma pessoa, muitas formas de somar'}</Text></View></View>
      {p.biografia?<Copy>{p.biografia}</Copy>:<Copy muted>Conte o que move você a fazer parte desta comunidade.</Copy>}
      <Tag>{p.publico&&p.adulto?'Perfil público autorizado':'Perfil privado'}</Tag>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:16}}>{[{n:p.conquistas.ajudas_confirmadas,l:'ajudas confirmadas'},{n:p.conquistas.campanhas_criadas,l:'campanhas criadas'},{n:p.conquistas.doacoes_simuladas,l:'doações simuladas'}].map(m=><View key={m.l} style={{flexGrow:1,flexBasis:120}}><Text style={{fontSize:24,lineHeight:32,color:colors.primary,fontFamily:fontsReady?'Sora-SemiBold':undefined}}>{m.n}</Text><Copy muted>{m.l}</Copy></View>)}</View>
      <Button secondary title="Personalizar perfil e privacidade" onPress={()=>router.push('/personalizar-perfil')}/>
      <Button secondary title="Meu histórico financeiro privado" onPress={()=>router.push('/atividade')}/>
    </View>
  </View>;
}
function Alternancia({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}){return <View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Switch accessibilityLabel={label} value={value} onValueChange={onChange}/><View style={{flex:1}}><Copy>{label}</Copy></View></View>;}
export function PersonalizarPerfil(){
  const router=useRouter(),consulta=useDados<PerfilAmpliado>(usuarioLogado()?'/perfil-ampliado':null);
  const config=useDados<Configuracao>('/configuracao');
  const [fotoGoogle,setFotoGoogle]=useState(false);
  const [tipo,setTipo]=useState('Pessoa'),[bio,setBio]=useState(''),[instituicao,setInstituicao]=useState(''),[adulto,setAdulto]=useState(false),[publico,setPublico]=useState(false),[local,setLocal]=useState(false),[apoios,setApoios]=useState(false),[cor,setCor]=useState('Azul royal'),[avatar,setAvatar]=useState<string|null>(null),[capa,setCapa]=useState<string|null>(null),[ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[mensagem,setMensagem]=useState('');
  useEffect(()=>{const p=consulta.dados;if(p){setTipo(p.tipo==='instituicao'?'Instituição':'Pessoa');setBio(p.biografia);setInstituicao(p.nome_instituicao);setAdulto(Boolean(p.adulto));setPublico(Boolean(p.publico));setLocal(Boolean(p.local_publico));setApoios(Boolean(p.apoios_publicos));setCor(p.cor==='verde'?'Verde cuidado':p.cor==='terracota'?'Terracota':'Azul royal');setAvatar(p.avatar_id);setCapa(p.capa_id);setFotoGoogle(Boolean(p.usar_foto_google));}},[consulta.dados]);
  async function salvar(){setOcupado(true);setErro('');try{const r=await requisitar<{mensagem:string}>('/perfil-ampliado','PUT',{tipo:tipo==='Instituição'?'instituicao':'pessoa',biografia:bio,nome_instituicao:instituicao,adulto,publico,local_publico:local,apoios_publicos:apoios,cor:cor==='Verde cuidado'?'verde':cor==='Terracota'?'terracota':'royal',avatar_id:avatar,capa_id:capa,usar_foto_google:fotoGoogle});setMensagem(r.mensagem);consulta.atualizar();}catch(e){setErro(mensagemErro(e));}finally{setOcupado(false);}}
  async function vincular(){setOcupado(true);setErro('');try{const r=await requisitar<{url:string}>('/auth/google/vincular','POST');if(Platform.OS==='web')window.location.assign(r.url);else throw new Error('Configure e utilize a vinculação Google na versão web.');}catch(e){setErro(mensagemErro(e));}finally{setOcupado(false);}}
  return <Screen variant="form" title="Seu perfil" heading="Uma presença que é sua.">
    {!usuarioLogado()?<PedirLogin/>:<><EstadoConexao {...consulta}/>{consulta.dados?<>
      <Choices label="Como você participa" options={['Pessoa','Instituição']} selected={tipo} onSelect={setTipo}/>{tipo==='Instituição'?<Field label="Nome da instituição *" value={instituicao} onChangeText={setInstituicao}/>:null}
      <ImagemPrivada id={capa} altura={160}/><EnviarArquivo finalidade="capa" aoEnviar={a=>setCapa(a.id)}/><ImagemPrivada id={avatar} altura={120}/><EnviarArquivo finalidade="avatar" aoEnviar={a=>setAvatar(a.id)}/>
      <Field label="Sua biografia" multiline value={bio} onChangeText={setBio} placeholder="Conte sua relação com a comunidade."/><Choices label="Cor do perfil" options={['Azul royal','Verde cuidado','Terracota']} selected={cor} onSelect={setCor}/>
      <Heading>Privacidade em primeiro lugar</Heading>{consulta.dados.foto_google?<Alternancia label="Usar a foto da minha conta Google" value={fotoGoogle} onChange={setFotoGoogle}/>:null}<Alternancia label="Declaro ser maior de 18 anos" value={adulto} onChange={setAdulto}/><Copy muted>Menores mantêm perfil privado e precisam de uma pessoa adulta responsável por campanhas. Sem essa declaração, campanhas ativas voltam para revisão. Esta declaração não é verificação de identidade.</Copy><Alternancia label="Autorizar perfil público" value={publico} onChange={setPublico}/><Alternancia label="Exibir minha região no perfil público" value={local} onChange={setLocal}/><Alternancia label="Exibir campanhas que apoiei" value={apoios} onChange={setApoios}/><Notice>Seu e-mail, telefone e histórico financeiro continuam privados. Autorizações públicas só valem para perfis de maiores de idade.</Notice>
      {erro?<Notice error>{erro}</Notice>:mensagem?<Notice success>{mensagem}</Notice>:null}<Button title={ocupado?'Salvando…':'Salvar perfil e privacidade'} disabled={ocupado} onPress={salvar}/>
      {Platform.OS==='web'&&config.dados?.google?<Button secondary title="Vincular minha conta Google" disabled={ocupado} onPress={vincular}/>:<Copy muted>Google depende de configuração oficial da equipe. O acesso por e-mail e senha continua disponível.</Copy>}
      <Button secondary title="Voltar ao meu perfil" onPress={()=>router.replace('/perfil')}/>
    </>:null}</>}
  </Screen>;
}
export function PerfilPublico(){
  const {id}=useLocalSearchParams<{id?:string}>(),router=useRouter();
  const consulta=useDados<{nome:string;tipo:string;nome_instituicao:string;biografia:string;regiao:string;avatar_id:string|null;capa_id:string|null;foto_google:string|null;campanhas:{id:string;titulo:string;estado:string}[];apoios:{id:string;titulo:string}[]}>(id?'/perfis/'+id:null),p=consulta.dados;
  return <Screen title="Na comunidade" heading={p?.tipo==='instituicao'?p.nome_instituicao:p?.nome}><EstadoConexao {...consulta}/>{p?<><ImagemPublica id={p.capa_id}/>{p.avatar_id?<ImagemPublica id={p.avatar_id} altura={100}/>:p.foto_google?<Image source={{uri:p.foto_google}} style={{width:100,height:100,borderRadius:50}} accessibilityLabel="Foto do perfil autorizada"/>:null}<Copy>{p.biografia}</Copy>{p.regiao?<Copy muted>{p.regiao}</Copy>:null}<Tag>{p.tipo==='instituicao'?'Instituição cadastrada':'Pessoa na comunidade'}</Tag><Copy muted>Ter um perfil público não representa verificação de identidade ou instituição.</Copy><Heading>Campanhas criadas</Heading>{p.campanhas.map(c=><Card key={c.id} title={c.titulo} subtitle={c.estado} onPress={()=>router.push({pathname:'/campanha',params:{id:c.id}})}/>)}{p.apoios.length?<Heading>Campanhas apoiadas com autorização</Heading>:null}{p.apoios.map(c=><Card key={c.id} title={c.titulo} onPress={()=>router.push({pathname:'/campanha',params:{id:c.id}})}/>)}</>:null}</Screen>;
}
export function AcessoGoogle(){
  const router=useRouter(),[erro,setErro]=useState('');
  const troca=useRef<Promise<{token:string;usuario:Usuario}>|null>(null);
  useEffect(()=>{let ativo=true;troca.current??=requisitar<{token:string;usuario:Usuario}>('/auth/google/trocar','POST');troca.current.then(s=>{if(ativo){guardarSessao(s.token,s.usuario);void destinoDaSessao().then(d=>{if(ativo)router.replace(d);}).catch(e=>{if(ativo)setErro(mensagemErro(e));});}}).catch(e=>{if(ativo)setErro(mensagemErro(e));});return()=>{ativo=false;};},[router]);
  return <Screen title="Acesso Google" heading="Conectando sua conta.">{erro?<><Notice error>{erro}</Notice><Button title="Entrar com e-mail e senha" onPress={()=>router.replace('/entrar')}/></>:<Copy>Aguarde a confirmação segura do acesso.</Copy>}</Screen>;
}
export { GoogleAcesso as BotaoGoogle } from '../components/google-acesso';
