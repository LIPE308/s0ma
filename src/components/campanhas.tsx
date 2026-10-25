import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { FotoDeCampanha } from './fotos';
import { Progress, Tag, useTheme } from './ui';
import { MotionPressable } from '../design/motion';
import { radius } from '../design/theme';
import { formatarDinheiro } from '../data/formatacao';
import type { Campanha, Necessidade } from '../servicos/api';
import { lerEvento } from '../data/eventos';

export function CartaoCampanha({ campanha, pedido, evento = false, cta, aoAbrir }: { campanha: Campanha; pedido?: Necessidade; evento?: boolean; cta?: string; aoAbrir: () => void }) {
  const { s, colors, fontsReady } = useTheme();
  const detalhes = evento ? lerEvento(campanha.evento) : null;
  const titulo = evento ? detalhes?.nome || campanha.evento : campanha.titulo;
  const acao = cta || (evento ? 'Ver evento' : campanha.estado === 'ativa' ? 'Ajudar agora' : 'Conhecer a causa');
  return <MotionPressable accessibilityRole="button" accessibilityLabel={acao + ': ' + titulo} accessibilityHint="Conhecer a história, os detalhes e como participar" onPress={aoAbrir} style={({ pressed }) => [{ overflow: 'hidden', borderRadius: radius.card, backgroundColor: colors.gentle, borderWidth: 1, borderColor: colors.line }, pressed && s.pressed]}>
    <FotoDeCampanha campanhaId={campanha.id} categoria={campanha.categoria}/>
    <View style={{ padding: 18, gap: 10 }}>
      <Text style={{ fontSize: 11, lineHeight: 16, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined, letterSpacing: .4, color: colors.accent }}>{campanha.categoria.toLocaleUpperCase()}</Text>
      {campanha.estado !== 'ativa' ? <Tag>{campanha.estado.toLocaleUpperCase()}</Tag> : null}
      <Text accessibilityRole="header" numberOfLines={2} style={[s.cardTitle, { flex: 0, fontSize: 19, lineHeight: 27 }]}>{titulo}</Text>
      <Text numberOfLines={2} style={s.cardSubtitle}>{evento ? campanha.titulo : campanha.descricao}</Text>
      {detalhes ? <Text style={s.cardSubtitle}>{detalhes.data + ' · ' + detalhes.horario}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="location-outline" size={15} color={colors.muted}/><Text style={[s.cardSubtitle, { fontSize: 12, flex: 1 }]}>{campanha.regiao}</Text></View>
      {!evento && pedido ? <View style={{ gap: 3, marginTop: 2 }}><Text style={[s.cardSubtitle, { fontSize: 12 }]}>{pedido.nome}: {pedido.tipo === 'dinheiro' ? formatarDinheiro(pedido.recebido / 100) + ' de ' + formatarDinheiro(pedido.meta / 100) + ' de teste' : pedido.recebido + ' de ' + pedido.meta + ' confirmados'}</Text><Progress done={pedido.recebido} total={pedido.meta}/></View> : null}
      <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.control, paddingHorizontal: 14, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={[s.buttonText, { color: colors.primary }]}>{acao}</Text><Ionicons name="arrow-forward" size={19} color={colors.primary}/>
      </View>
    </View>
  </MotionPressable>;
}
