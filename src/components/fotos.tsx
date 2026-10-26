import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Button, useTheme } from './ui';
import { useReducedMotion } from '../design/motion';
import { radius } from '../design/theme';
const imagens = {
  familia: require('../../assets/photos/familia-unsplash-v2.jpg'),
  voluntariado: require('../../assets/photos/voluntariado-unsplash.jpg'),
  educacao: require('../../assets/photos/educacao-unsplash.jpg'),
  protecaoAnimal: require('../../assets/photos/protecao-animal-unsplash.jpg'),
  comunidade: require('../../assets/photos/comunidade-unsplash.jpg'),
};

// Uma foto editorial por campanha de exemplo. Novas campanhas não herdam fotos de outras causas.
const fotosDeCampanhas: Record<string, { source: number; descricao: string }> = {
  familia: { source: imagens.familia, descricao: 'Família reunida ao entardecer' },
  biblioteca: { source: imagens.educacao, descricao: 'Crianças entre livros em uma atividade de educação' },
  abrigo: { source: imagens.protecaoAnimal, descricao: 'Uma cuidadora com cães em um abrigo' },
};

function FotoEditorial({ source, descricao, height, style, position = 'center' }: { source: number; descricao: string; height: number; style?: StyleProp<ViewStyle>; position?: 'top' | 'center' }) {
  const { colors, fontsReady } = useTheme(); const reduced = useReducedMotion();
  return <View style={[{ height, backgroundColor: colors.soft, overflow: 'hidden' }, style]}>
    <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={position} cachePolicy="memory-disk" transition={reduced ? 0 : 160} accessibilityLabel={descricao + '; foto ilustrativa, sem relação com os participantes desta campanha'}/>
    {height>=130?<View pointerEvents="none" style={{ alignSelf: 'flex-end', margin: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.photoScrim }}>
      <Text style={{ color: colors.onPhoto, fontSize: 10, lineHeight: 15, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined }}>Foto ilustrativa</Text>
    </View>:null}
  </View>;
}

export function FotoDeAcolhimento({ aoEncontrar }: { aoEncontrar: () => void }) {
  const { s, colors, fontsReady } = useTheme(); const { width } = useWindowDimensions(); const compacto = width < 680;
  return <View style={{ flexDirection: compacto ? 'column' : 'row', borderRadius: radius.hero, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
    <FotoEditorial source={imagens.comunidade} descricao="Pessoas colaborando na distribuição de doações" position="top" height={compacto ? 154 : 250} style={{ width: compacto ? '100%' : 300, flexShrink: 0 }}/>
    <View style={{ flex: 1, justifyContent: 'center', padding: 18, gap: 10 }}>
      <Text style={{ color: colors.gentleInk, fontSize: 10, letterSpacing: 1, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined }}>PESSOAS AJUDANDO PESSOAS</Text>
      <Text accessibilityRole="header" style={[s.featureTitle, { color: colors.ink, fontSize: 25, lineHeight: 31 }]}>Toda ajuda conta.</Text>
      <Text style={[s.cardSubtitle, { lineHeight: 21 }]}>Pequenos gestos podem transformar grandes histórias. Encontre uma causa e faça parte dessa mudança.</Text>
      <Button title="Encontrar uma causa" onPress={aoEncontrar}/>
    </View>
  </View>;
}

export function FotoDeCampanha({ campanhaId, categoria, height = 180 }: { campanhaId: string; categoria: string; height?: number }) {
  const { colors, fontsReady } = useTheme(); const foto = fotosDeCampanhas[campanhaId];
  if (foto) return <FotoEditorial source={foto.source} descricao={foto.descricao} height={height} style={{ borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}/>;
  return <View style={{ height, padding: 16, justifyContent: 'center', alignItems: 'flex-start', gap: 10, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, backgroundColor: colors.brandSoft }}>
    <Ionicons name="people-outline" size={32} color={colors.primary}/>
    {height>110?<Text style={{ color: colors.primary, fontSize: 15, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined }}>{categoria} · uma causa da comunidade</Text>:null}
  </View>;
}

export function FotoDeVoluntariado() {
  return <FotoEditorial source={imagens.voluntariado} descricao="Voluntários organizando alimentos para doação" height={176} style={{ borderRadius: radius.card }}/>;
}
