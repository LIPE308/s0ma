import { useState } from 'react';
import { Image, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Copy, Notice } from './ui';
import { requisitar, mensagemErro, urlApi, useDados } from '../servicos/api';
import type { Arquivo } from '../servicos/soma2';

export function ImagemPublica({ id, altura = 180 }: { id?:string|null; altura?:number }) {
  return id ? <Image accessibilityLabel="Imagem compartilhada pelo responsável" source={{uri:urlApi()+'/arquivos/'+id+'/imagem'}} style={{width:'100%',height:altura,borderRadius:20}} resizeMode="cover"/> : null;
}
export function ImagemPrivada({ id, altura = 180 }: { id?:string|null; altura?:number }) {
  const consulta=useDados<Arquivo>(id?'/arquivos/'+id:null);
  return consulta.dados?.base64 ? <Image accessibilityLabel="Imagem privada autorizada" source={{uri:'data:'+consulta.dados.mime+';base64,'+consulta.dados.base64}} style={{width:'100%',height:altura,borderRadius:20}} resizeMode="cover"/> : null;
}
export async function escolherDocumento(soImagem=false){
  const escolha=await DocumentPicker.getDocumentAsync({type:soImagem?['image/jpeg','image/png']:['application/pdf','image/jpeg','image/png'],copyToCacheDirectory:true});
  if(escolha.canceled)return null;const arquivo=escolha.assets[0];
  if(!arquivo.size||arquivo.size>2*1024*1024)throw new Error('Escolha um JPEG, PNG ou PDF de até 2 MB.');
  let base64:string;
  if(Platform.OS==='web'){const r=await fetch(arquivo.uri);const blob=await r.blob();base64=await new Promise<string>((resolve,reject)=>{const leitor=new FileReader();leitor.onload=()=>resolve(String(leitor.result).split(',')[1]);leitor.onerror=()=>reject(new Error('Não foi possível ler o arquivo.'));leitor.readAsDataURL(blob);});}
  else base64=await FileSystem.readAsStringAsync(arquivo.uri,{encoding:FileSystem.EncodingType.Base64});
  return {nome:arquivo.name,base64};
}
export function EnviarArquivo({finalidade,campanha,aoEnviar}:{finalidade:'documento'|'campanha'|'avatar'|'capa';campanha?:string;aoEnviar:(arquivo:Arquivo)=>void}){
 const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');
 async function escolher(){setOcupado(true);setErro('');try{const arquivo=await escolherDocumento(finalidade!=='documento');if(!arquivo)return;const salvo=await requisitar<Arquivo>('/arquivos','POST',{...arquivo,finalidade,campanha_id:campanha,consentimento:true});aoEnviar(salvo);}catch(e){setErro(mensagemErro(e));}finally{setOcupado(false);}}
 return <><Copy muted>{finalidade==='documento'?'Somente você e a equipe de revisão podem abrir este documento.':'Escolha uma foto autorizada, sem documentos nem informações sensíveis.'} Até 2 MB, JPEG/PNG{finalidade==='documento'?' ou PDF':''}.</Copy><Button secondary title={ocupado?'Enviando…':finalidade==='documento'?'Adicionar documento privado':finalidade==='campanha'?'Adicionar foto da campanha':finalidade==='avatar'?'Escolher foto de perfil':'Escolher capa'} disabled={ocupado} onPress={escolher}/>{erro?<Notice error>{erro}</Notice>:null}</>;
}
export function AbrirArquivo({arquivo}:{arquivo:Arquivo}){
  const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');
  async function abrir(){
    setOcupado(true);setErro('');
    try{
      const dados=await requisitar<Arquivo>('/arquivos/'+arquivo.id);
      if(!dados.base64)throw new Error('Arquivo indisponível.');
      if(Platform.OS==='web'){
        const bytes=Uint8Array.from(atob(dados.base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:dados.mime}));
        const a=document.createElement('a');a.href=url;a.download=dados.nome;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      }else{
        const extensao=dados.mime==='application/pdf'?'.pdf':dados.mime==='image/png'?'.png':'.jpg',uri=FileSystem.cacheDirectory+dados.id+extensao;
        await FileSystem.writeAsStringAsync(uri,dados.base64,{encoding:FileSystem.EncodingType.Base64});
        if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:dados.mime,dialogTitle:'Documento privado da campanha'});else throw new Error('Abertura de arquivos indisponível neste aparelho.');
      }
    }catch(e){setErro(mensagemErro(e));}finally{setOcupado(false);}
  }
  return <><Button secondary title={ocupado?'Abrindo…':'Baixar: '+arquivo.nome} disabled={ocupado} onPress={abrir}/>{erro?<Notice error>{erro}</Notice>:null}</>;
}
