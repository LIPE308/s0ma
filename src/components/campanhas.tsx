import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotionPressable } from '../design/motion';
import { FotoDeCampanha } from './fotos';
import { ImagemPublica } from './arquivos';
import { Progress, useTheme } from './ui';
import { formatarDinheiro } from '../data/formatacao';
import type { Campanha, Necessidade } from '../servicos/api';
import { lerEvento } from '../data/eventos';
export function CartaoCampanha({campanha,pedido,evento=false,cta,aoAbrir,compacto=false}:{campanha:Campanha;pedido?:Necessidade;evento?:boolean;cta?:string;aoAbrir:()=>void;compacto?:boolean}){
 const {colors,fontsReady}=useTheme(),e=evento?lerEvento(campanha.evento):null,titulo=evento?e?.nome||campanha.evento:campanha.titulo;
 const financeira=(campanha.meta_financeira||0)>0,meta=financeira?campanha.meta_financeira||0:pedido?.meta||0,recebido=financeira?campanha.recebido_financeiro||0:pedido?.recebido||0;
 return <MotionPressable accessibilityRole="button" accessibilityLabel={(cta||'Conhecer campanha')+': '+titulo} onPress={aoAbrir} style={({pressed})=>({flexDirection:compacto?'row':'column',gap:compacto?14:0,overflow:'hidden',borderRadius:compacto?18:24,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,padding:compacto?12:0,opacity:pressed?.8:1})}>
 <View style={{width:compacto?86:'100%',height:compacto?100:190,overflow:'hidden',borderRadius:compacto?12:0,backgroundColor:colors.soft}}>{campanha.imagem_id?<ImagemPublica id={campanha.imagem_id} altura={compacto?100:190}/>:<FotoDeCampanha campanhaId={campanha.id} categoria={campanha.categoria} height={compacto?100:190}/>}</View>
 <View style={{flex:compacto?1:undefined,minWidth:0,padding:compacto?0:18,gap:compacto?6:10,justifyContent:'center'}}>
 {!compacto?<Text style={{fontSize:12,color:colors.primary,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>{campanha.categoria}</Text>:null}
 <Text accessibilityRole="header" aria-level={2} numberOfLines={compacto?2:3} style={{fontSize:compacto?15:19,lineHeight:compacto?22:27,fontFamily:fontsReady?'Manrope-SemiBold':undefined,color:colors.ink}}>{titulo}</Text>
 {!compacto?<Text numberOfLines={2} style={{fontSize:14,lineHeight:23,color:colors.muted}}>{campanha.descricao}</Text>:null}
 {campanha.urgencia?.revisada?<Text style={{fontSize:12,lineHeight:19,color:colors.primary}}>Urgência {campanha.urgencia.classe==='critica'?'crítica':'moderada'} revisada</Text>:null}
 {!evento&&meta>0?<><Text style={{fontSize:compacto?12:14,lineHeight:21,color:colors.ink,fontFamily:fontsReady?'Manrope-SemiBold':undefined}}>{financeira?formatarDinheiro(recebido/100)+' de '+formatarDinheiro(meta/100):recebido+' de '+meta+' confirmados'}</Text><Progress done={recebido} total={meta}/>{!compacto&&financeira?<Text style={{fontSize:11,color:colors.muted}}>Valores de demonstração</Text>:null}</>:evento?<Text style={{fontSize:13,lineHeight:21,color:colors.muted}}>{e?.data||campanha.prazo}</Text>:<Text style={{fontSize:13,lineHeight:21,color:colors.muted}}>Ajude com objetos ou tempo</Text>}
 {!compacto?<View style={{flexDirection:'row',alignItems:'center',gap:6,paddingTop:4}}><Text style={{color:colors.primary,fontFamily:fontsReady?'Manrope-SemiBold':undefined,fontSize:14,flex:1}}>{cta||'Conhecer a campanha'}</Text><Ionicons aria-hidden accessible={false} name="arrow-forward" color={colors.primary} size={19}/></View>:null}
 </View></MotionPressable>;
}
