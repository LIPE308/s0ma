import { ImageBackground, Text, View, useWindowDimensions } from 'react-native';
import { Button, useTheme } from './ui';

// Fotos editoriais licenciadas pelo Unsplash. Nunca representam beneficiários de campanhas.
export const imagensIlustrativas = {
  familia: require('../../assets/photos/familia-unsplash-v2.jpg'),
  voluntariado: require('../../assets/photos/voluntariado-unsplash.jpg'),
  educacao: require('../../assets/photos/educacao-unsplash.jpg'),
  protecaoAnimal: require('../../assets/photos/protecao-animal-unsplash.jpg'),
};

export function fotoDaCategoria(categoria: string) {
  const tema = categoria.toLocaleLowerCase();
  if (tema.includes('fam')) return imagensIlustrativas.familia;
  if (tema.includes('educ')) return imagensIlustrativas.educacao;
  if (tema.includes('animal')) return imagensIlustrativas.protecaoAnimal;
  return imagensIlustrativas.voluntariado;
}

export function FotoDeAcolhimento({ aoEncontrar }: { aoEncontrar: () => void }) {
  const { s, colors } = useTheme();
  const { width } = useWindowDimensions();
  const compacto = width < 680;
  return <View style={{ flexDirection: compacto ? 'column' : 'row', borderRadius: 24, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
    <ImageBackground source={imagensIlustrativas.familia} imageStyle={{ borderRadius: compacto ? 0 : 23 }} style={{ width: compacto ? '100%' : 300, flexShrink: 0, height: compacto ? 160 : 224, justifyContent: 'flex-start' }} accessibilityRole="image" accessibilityLabel="Família reunida ao pôr do sol; fotografia ilustrativa, sem relação com uma campanha específica">
      <Text style={{ alignSelf: 'flex-end', color: '#fff', backgroundColor: 'rgba(24,25,31,0.7)', fontSize: 10, lineHeight: 15, paddingHorizontal: 9, paddingVertical: 5, margin: 12, borderRadius: 12 }}>Foto ilustrativa</Text>
    </ImageBackground>
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 8 }}>
      <Text accessibilityRole="header" style={[s.featureTitle, { color: colors.ink, fontSize: 25, lineHeight: 30 }]}>Toda ajuda conta.</Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>Pessoas ajudam pessoas. Encontre uma causa e faça parte dessa mudança.</Text>
      <Button inverse title="Encontrar uma causa" onPress={aoEncontrar}/>
    </View>
  </View>;
}

export function FotoDeCampanha({ categoria }: { categoria: string }) {
  return <ImageBackground source={fotoDaCategoria(categoria)} imageStyle={{ borderTopLeftRadius: 19, borderTopRightRadius: 19 }} style={{ height: 146, justifyContent: 'flex-end' }} accessibilityRole="image" accessibilityLabel={`Foto ilustrativa de ${categoria.toLocaleLowerCase()}, sem relação com os participantes desta campanha`}>
    <Text style={{ alignSelf: 'flex-start', color: '#fff', backgroundColor: 'rgba(24,25,31,0.7)', fontSize: 10, paddingHorizontal: 9, paddingVertical: 5, margin: 10, borderRadius: 12 }}>Foto ilustrativa</Text>
  </ImageBackground>;
}

export function FotoDeVoluntariado() {
  return <ImageBackground source={imagensIlustrativas.voluntariado} imageStyle={{ borderRadius: 20 }} style={{ height: 172, borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end' }} accessibilityRole="image" accessibilityLabel="Voluntários organizando doações; fotografia ilustrativa, sem relação com esta campanha">
    <Text style={{ alignSelf: 'flex-start', color: '#fff', backgroundColor: 'rgba(24,25,31,0.7)', fontSize: 11, paddingHorizontal: 10, paddingVertical: 6, margin: 10, borderRadius: 12 }}>Voluntariado · foto ilustrativa</Text>
  </ImageBackground>;
}
