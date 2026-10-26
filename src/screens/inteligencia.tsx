import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { Button, Copy } from '../components/ui';
import type { Marco } from '../components/estrada-base';
export { RotaInteligente } from './rota';
export { FundoSolidario as SolidariedadeAdmin } from './fundo';
export type Inteligencia = { campanha:string; categoria?:string; estado?:string; meta:number; arrecadado:number; restante:number; percentual:number; doacoes:number; anuncios:number; rendimentos:number; saldo_disponivel:number; marcos:Marco[]; urgencia:{categoria:string;verificada:boolean};uf:string;imagem:string };
export async function escolherImagem() {
  const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: .8 });
  if (resultado.canceled) return null;
  const imagem = resultado.assets[0];
  for (const [largura, qualidade] of [[800, .65], [600, .5], [400, .4], [240, .3]]) {
    const ajustada = await manipulateAsync(imagem.uri, [{ resize: { width: Math.min(largura, imagem.width || largura) } }], { compress: qualidade, format: SaveFormat.JPEG, base64: true });
    const conteudo = `data:image/jpeg;base64,${ajustada.base64}`;
    if (ajustada.base64 && conteudo.length <= 70000) return conteudo;
  }
  throw new Error('Não conseguimos preparar essa imagem. Tente outra foto.');
}
export function RecursosCampanha({id}:{id:string}) { const r=useRouter();return <><Copy>Prepare documentos privados, foto, consentimento do mapa e o envio para revisão.</Copy><Button title="Preparar publicação e evidências" onPress={()=>r.push({pathname:'/preparar-campanha',params:{id}})}/><Button secondary title="Solicitar ou acompanhar urgência" onPress={()=>r.push({pathname:'/urgencia',params:{id}})}/></>; }
