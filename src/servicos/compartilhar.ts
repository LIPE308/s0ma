import { Share, Platform } from 'react-native';
import { criarChaveOperacao, requisitar, usuarioLogado } from './api';
export function enderecoPublico(campanha?:string){
 const base=Platform.OS==='web'&&typeof window!=='undefined'?window.location.origin:'soma://';
 return campanha?(base==='soma://'?'soma://':base+'/')+'campanha?id='+encodeURIComponent(campanha):base;
}
export async function compartilhar(titulo:string,campanha?:string){
 const url=enderecoPublico(campanha),message=titulo+' · '+url;
 let canal:'link'|'nativo'='nativo';
 if(Platform.OS==='web'&&typeof navigator!=='undefined'&&!navigator.share){
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{if(!navigator.clipboard?.writeText)throw new Error();await Promise.race([navigator.clipboard.writeText(url),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error()),2500);})]);canal='link';}
  catch{throw new Error('Copie este endereço e envie para quem quiser: '+url);}
  finally{if(timer)clearTimeout(timer);}
 }
 else{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{const envio=Share.share({message,url:Platform.OS==='ios'?url:undefined,title:titulo});const r=Platform.OS==='web'?await Promise.race([envio,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Não foi possível concluir pelo navegador. Copie este endereço: '+url)),8000);})]):await envio;if(r.action===Share.dismissedAction)return 'Compartilhamento cancelado.';}
  catch(e){if(e instanceof Error&&e.name==='AbortError')return 'Compartilhamento cancelado.';throw e;}
  finally{if(timer)clearTimeout(timer);}
 }
 if(campanha&&usuarioLogado())void requisitar('/campanhas/'+campanha+'/compartilhar','POST',{id:criarChaveOperacao(),canal}).catch(()=>{});
 return canal==='link'?'Link copiado. Agora você pode enviar para quem quiser.':'Compartilhamento aberto. Obrigado por espalhar essa causa.';
}
