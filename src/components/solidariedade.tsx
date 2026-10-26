import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Copy, Progress, useTheme } from './ui';
import { compartilhar } from '../servicos/compartilhar';
import { mensagemErro } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
import type { Rota } from '../servicos/soma2';
export function BotaoCompartilhar({id,titulo,principal=false}:{id?:string;titulo:string;principal?:boolean}){
 const [ocupado,setOcupado]=useState(false),[mensagem,setMensagem]=useState('');const {colors}=useTheme();
 async function abrir(){setOcupado(true);try{setMensagem(await compartilhar(titulo,id));}catch(e){setMensagem(mensagemErro(e));}finally{setOcupado(false);}}
 return <View style={{gap:8}}><Button secondary={!principal} title={ocupado?'Preparando…':id?'Compartilhar campanha':'Convidar amigos'} disabled={ocupado} onPress={abrir}/>{mensagem?<Text selectable accessibilityLiveRegion="polite" style={{fontSize:13,lineHeight:20,color:colors.muted}}>{mensagem}</Text>:null}</View>;
}
export function CartaoAnuncios({rota}:{rota:Rota}){
 const router=useRouter(),{colors,fontsReady}=useTheme();const cadencia=rota.projecao.anuncios;
 const percentual=cadencia&&rota.confirmado>0?cadencia.mensal/rota.confirmado*100:null;
 return <View style={{padding:16,borderRadius:18,gap:8,backgroundColor:colors.gentle}}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons aria-hidden accessible={false} name="leaf-outline" color={colors.gentleInk} size={24}/><View style={{flex:1,gap:4}}><Text style={{color:colors.gentleInk,fontSize:15,lineHeight:22,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>Anúncios solidários</Text><Text style={{color:colors.gentleInk,fontSize:13,lineHeight:20}}>{rota.anuncios_creditados>0?formatarDinheiro(rota.anuncios_creditados/100)+' atribuídos no teste.':'Podem ajudar esta causa.'} Simulação, sem rede ativa.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Como funcionam os anúncios solidários" onPress={()=>router.push('/transparencia-anuncios')} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons aria-hidden accessible={false} name="information-circle-outline" color={colors.gentleInk} size={23}/></Pressable></View>{percentual!==null?<Copy muted>Hipótese para 30 dias: {percentual.toFixed(1).replace('.',',')}% do valor confirmado atual, mantida a cadência de {cadencia!.amostras} créditos em {cadencia!.dias} dias. Sem garantia de receita.</Copy>:null}</View>;
}
export function ResumoArrecadacao({rota}:{rota:Rota}){
 const {colors,fontsReady}=useTheme();return <View style={{gap:10}}><Text style={{fontFamily:fontsReady?'Sora-SemiBold':undefined,fontSize:29,lineHeight:39,color:colors.ink}}>{formatarDinheiro(rota.confirmado/100)} <Text style={{fontSize:14,color:colors.muted}}>de {formatarDinheiro(rota.meta/100)}</Text></Text><Progress done={rota.confirmado} total={rota.meta}/><Text style={{fontSize:13,lineHeight:20,color:colors.muted}}>{rota.percentual.toFixed(0)}% da meta · valores de demonstração</Text></View>;
}
