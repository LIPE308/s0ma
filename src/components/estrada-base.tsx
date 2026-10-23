import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ui';
export type Marco = { id: string; titulo: string; valor: number; concluido: boolean; data: string | null; icone: string; unidade?: string };
export type EstradaProps = { marcos: Marco[]; selecionado: number; aoSelecionar: (indice: number) => void; percentual: number };
export function EstradaAlternativa({ marcos, selecionado, aoSelecionar }: EstradaProps) {
  const { colors } = useTheme(); const atual = marcos.findIndex(m => !m.concluido);
  return <View accessibilityLabel="Estrada em perspectiva, alternativa leve" style={{ height: 420, overflow: 'hidden', borderRadius: 28, backgroundColor: colors.brandSoft }}>
    <Text style={{ color: colors.muted, textAlign: 'center', padding: 14 }}>Versão leve · toque nos objetivos</Text>
    {Array.from({ length: 70 }, (_, i) => { const t = i / 69; const w = 8 + t * 100; return <View key={i} style={{ position: 'absolute', top: 55 + t * 335, left: `${50 + Math.sin(t * 8) * t * 15}%`, marginLeft: -w / 2, width: w, height: 8, backgroundColor: colors.muted, borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.surface, transform: [{ rotate: `${Math.cos(t * 8) * -18}deg` }] }}/>; })}
    {[...marcos].reverse().map((m, n) => { const i = marcos.length - 1 - n; const t = n / Math.max(1, marcos.length - 1); return <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`${m.titulo}, ${m.concluido ? 'concluído' : i === atual ? 'atual' : 'futuro'}`} accessibilityState={{ selected: i === selecionado }} onPress={() => aoSelecionar(i)} style={{ position: 'absolute', top: 45 + t * 320, left: `${50 + Math.sin(t * 8) * t * 15}%`, marginLeft: -22, height: 44, width: 44, borderRadius: 22, borderWidth: i === selecionado ? 3 : 1, borderColor: colors.primary, backgroundColor: m.concluido ? colors.gentleInk : i === atual ? colors.hero : colors.surface, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 5px 0px rgba(0,0,0,.18)' }}><Ionicons name={m.icone === 'console' ? 'game-controller' : m.icone === 'livro' ? 'book' : m.icone === 'casa' ? 'home' : m.icone === 'saude' ? 'medical' : m.icone === 'animal' ? 'paw' : m.icone === 'arvore' ? 'leaf' : m.icone === 'alimentos' ? 'basket' : m.icone === 'objetivo' ? 'flag' : m.icone === 'pessoas' ? 'people' : m.icone === 'trofeu' ? 'trophy' : m.icone === 'coracao' ? 'heart' : m.icone === 'anuncio' ? 'megaphone' : m.icone === 'grafico' ? 'bar-chart' : 'cash'} color={m.concluido || i === atual ? colors.onHero : colors.primary} size={20}/></Pressable>; })}
  </View>;
}
export default EstradaAlternativa;
