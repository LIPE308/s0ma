import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Copy, Progress, useTheme } from './ui';
import { compartilhar } from '../servicos/compartilhar';
import { mensagemErro } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
import type { Rota } from '../servicos/soma2';
export function BotaoCompartilhar({id,titulo,principal=false,rotulo}:{id?:string;titulo:string;principal?:boolean;rotulo?:string}){
 const [ocupado,setOcupado]=useState(false),[mensagem,setMensagem]=useState('');const {colors}=useTheme();
 async function abrir(){setOcupado(true);try{setMensagem(await compartilhar(titulo,id));}catch(e){setMensagem(mensagemErro(e));}finally{setOcupado(false);}}
 return <View style={{gap:8}}><Button secondary={!principal} title={ocupado?'Preparando…':rotulo||(id?'Compartilhar campanha':'Convidar amigos')} disabled={ocupado} onPress={abrir}/>{mensagem?<Text selectable accessibilityLiveRegion="polite" style={{fontSize:13,lineHeight:20,color:colors.muted}}>{mensagem}</Text>:null}</View>;
}
export function ConviteCompartilharApp(){
 const router=useRouter(),{colors,fontsReady}=useTheme();
 return <View style={{padding:20,borderRadius:22,gap:12,backgroundColor:colors.brandSoft}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Ionicons aria-hidden accessible={false} name="share-social-outline" size={24} color={colors.primary}/><Text style={{flex:1,fontSize:18,lineHeight:26,color:colors.ink,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>Sua ajuda pode ir mais longe.</Text></View>
  <Copy>Compartilhe o SOMA com quem você conhece. Mais pessoas usando o app podem ampliar a receita de anúncios e o apoio às campanhas emergenciais com urgência revisada.</Copy>
  <BotaoCompartilhar rotulo="Compartilhar o SOMA" titulo="Conheça o SOMA e ajude histórias a encontrar apoio."/>
  <Text style={{fontSize:12,lineHeight:20,color:colors.muted}}>Nesta versão, os anúncios e o fundo são simulados. Compartilhar não gera crédito nem garante receita. Na regra do fundo, 70% da receita líquida elegível vai para emergências revisadas.</Text>
  <Button secondary title="Entender os anúncios solidários" onPress={()=>router.push('/transparencia-anuncios')}/>
 </View>;
}
export function CartaoAnuncios({rota}:{rota:Rota}){
 const router=useRouter(),{colors,fontsReady}=useTheme();const cadencia=rota.projecao.anuncios;
 const percentual=cadencia&&rota.confirmado>0?cadencia.mensal/rota.confirmado*100:null;
 return <View style={{padding:16,borderRadius:18,gap:8,backgroundColor:colors.gentle}}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons aria-hidden accessible={false} name="leaf-outline" color={colors.gentleInk} size={24}/><View style={{flex:1,gap:4}}><Text style={{color:colors.gentleInk,fontSize:15,lineHeight:22,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>Anúncios solidários</Text><Text style={{color:colors.gentleInk,fontSize:13,lineHeight:20}}>{rota.anuncios_creditados>0?formatarDinheiro(rota.anuncios_creditados/100)+' atribuídos no teste.':'Podem ajudar esta causa.'} Simulação, sem rede ativa.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Como funcionam os anúncios solidários" onPress={()=>router.push('/transparencia-anuncios')} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons aria-hidden accessible={false} name="information-circle-outline" color={colors.gentleInk} size={23}/></Pressable></View>{percentual!==null?<Copy muted>Hipótese para 30 dias: {percentual.toFixed(1).replace('.',',')}% do valor confirmado atual, mantida a cadência de {cadencia!.amostras} créditos em {cadencia!.dias} dias. Sem garantia de receita.</Copy>:null}</View>;
}
export function ResumoArrecadacao({rota}:{rota:Rota}){
 const {colors,fontsReady}=useTheme();return <View style={{gap:10}}><Text style={{fontFamily:fontsReady?'Sora-SemiBold':undefined,fontSize:29,lineHeight:39,color:colors.ink}}>{formatarDinheiro(rota.confirmado/100)} <Text style={{fontSize:14,color:colors.muted}}>de {formatarDinheiro(rota.meta/100)}</Text></Text><Progress done={rota.confirmado} total={rota.meta}/><Text style={{fontSize:13,lineHeight:20,color:colors.muted}}>{rota.percentual.toFixed(0)}% da meta · valores de demonstração</Text></View>;
}
