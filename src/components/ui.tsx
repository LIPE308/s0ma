// A01: componentes; A02: StyleSheet/Flexbox; A05: props e navegação.
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const colors = { bg: '#F2F4FA', surface: '#FFFFFF', ink: '#17244E', muted: '#59617A', primary: '#264FCB', soft: '#E4EBFF', accent: '#EDB838', line: '#CAD3E8' };

export function Logo() {
  return <View style={s.row}><View style={s.mark}><Text style={s.plus}>+</Text></View><Text style={s.logo}>soma</Text></View>;
}

export function Screen({ title, heading, subtitle, children, back = true, step, action }: { title: string; heading?: string; subtitle?: string; children: ReactNode; back?: boolean; step?: string; action?: ReactNode }) {
  const router = useRouter();
  return <View style={s.screen}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={s.demo}><View style={s.dot}/><Text style={s.demoText}>PROJETO ACADÊMICO · SOMA</Text></View>
      <View style={s.header}>
        <View style={s.row}>{back ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}><Ionicons name="arrow-back" size={22} color={colors.primary}/></TouchableOpacity> : null}{title === 'soma' ? <Logo/> : <Text style={s.headerTitle}>{title}</Text>}</View>
        {action}
      </View>
      {step ? <Text style={s.eyebrow}>{step}</Text> : null}
      {heading ? <Text accessibilityRole="header" style={s.heading}>{heading}</Text> : null}
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      <View style={s.body}>{children}</View>
      <Text style={s.footer}>Toda ajuda conta. Soma / Pulso.</Text>
    </ScrollView>
  </View>;
}

export function Button({ title, onPress, secondary = false, disabled = false, danger = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; danger?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} activeOpacity={0.7} onPress={onPress} style={[s.button, secondary && s.secondary, danger && s.danger, disabled && s.disabled]}><Text style={[s.buttonText, secondary && s.secondaryText, danger && s.dangerText]}>{title}</Text></TouchableOpacity>;
}

export function Field({ label, value, onChangeText, placeholder, secret, multiline, numeric, email }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secret?: boolean; multiline?: boolean; numeric?: boolean; email?: boolean }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChangeText} secureTextEntry={secret} multiline={multiline} keyboardType={numeric ? 'numeric' : email ? 'email-address' : 'default'} autoCapitalize={email || secret ? 'none' : 'sentences'} style={[s.input, multiline && s.multiline]}/></View>;
}

export function Copy({ children, muted = false }: { children: ReactNode; muted?: boolean }) { return <Text style={[s.copy, muted && s.muted]}>{children}</Text>; }
export function Heading({ children }: { children: ReactNode }) { return <Text accessibilityRole="header" style={s.sectionTitle}>{children}</Text>; }
export function Tag({ children }: { children: ReactNode }) { return <View style={s.tag}><Text style={s.tagText}>{children}</Text></View>; }
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) { return <View style={[s.notice, error && s.error]}><Text accessibilityLiveRegion="polite" style={[s.noticeText, error && s.errorText]}>{children}</Text></View>; }
export function Card({ title, subtitle, children, onPress, icon = 'heart-outline' }: { title: string; subtitle?: string; children?: ReactNode; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const contents = <><View style={s.cardTop}><View style={s.icon}><Ionicons name={icon} size={22} color={colors.primary}/></View><Text style={s.cardTitle}>{title}</Text>{onPress ? <Ionicons name="chevron-forward" size={18} color={colors.primary}/> : null}</View>{subtitle ? <Text style={s.cardSubtitle}>{subtitle}</Text> : null}{children}</>;
  return onPress ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} onPress={onPress} activeOpacity={0.7} style={s.card}>{contents}</TouchableOpacity> : <View style={s.card}>{contents}</View>;
}

export function Choices({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={s.choices}>{options.map(option => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: selected === option }} key={option} onPress={() => onSelect(option)} style={[s.choice, selected === option && s.choiceActive]}><Text style={[s.choiceText, selected === option && s.choiceTextActive]}>{option}</Text></TouchableOpacity>)}</View>;
}

export function Line({ label, value }: { label: string; value: string }) { return <View style={s.line}><Text style={s.lineLabel}>{label}</Text><Text style={s.lineValue}>{value}</Text></View>; }
export function Progress({ done, total }: { done: number; total: number }) { return <View style={s.progress}><View style={[s.progressFill, { width: `${Math.min(100, done / total * 100)}%` }]}/></View>; }

export function Dialog({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  return <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}><View style={s.overlay}><ScrollView style={s.dialog} contentContainerStyle={s.dialogContent}><View style={s.header}><Text style={s.sectionTitle}>{title}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar janela" onPress={onClose}><Ionicons name="close" color={colors.ink} size={24}/></TouchableOpacity></View>{children}</ScrollView></View></Modal>;
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg }, content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, paddingBottom: 32 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 22 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, demoText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingBottom: 18, marginBottom: 24, borderBottomWidth: 1, borderColor: colors.line }, headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 }, back: { padding: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, mark: { width: 34, height: 34, borderRadius: 4, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }, plus: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 34 }, logo: { fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.ink, lineHeight: 35, marginBottom: 8 }, subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 24 }, eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 }, body: { gap: 18 }, footer: { fontSize: 11, lineHeight: 18, color: colors.muted, marginTop: 32 },
  button: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' }, secondary: { backgroundColor: colors.surface, borderColor: colors.line }, secondaryText: { color: colors.primary }, disabled: { opacity: 0.45 }, danger: { backgroundColor: '#FFF0EF', borderColor: '#E8B2AC' }, dangerText: { color: '#9E332C' },
  field: { gap: 8 }, label: { color: colors.muted, fontSize: 12, fontWeight: '700' }, input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, fontSize: 15, color: colors.ink }, multiline: { minHeight: 110, textAlignVertical: 'top', lineHeight: 23 },
  copy: { color: colors.ink, fontSize: 14, lineHeight: 23 }, muted: { color: colors.muted }, sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  tag: { backgroundColor: colors.soft, borderRadius: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6 }, tagText: { fontSize: 11, fontWeight: '800', color: colors.primary }, notice: { padding: 16, borderRadius: 8, backgroundColor: colors.soft }, noticeText: { fontSize: 13, lineHeight: 21, color: colors.ink }, error: { backgroundColor: '#FFF0EF' }, errorText: { color: '#9E332C' },
  card: { padding: 18, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.line, gap: 10 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, flex: 1 }, icon: { backgroundColor: colors.soft, borderRadius: 8, padding: 8 }, cardSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 21 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { flexGrow: 1, paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }, choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary }, choiceText: { fontSize: 12, color: colors.ink, fontWeight: '600' }, choiceTextActive: { color: '#fff' },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingVertical: 9 }, lineLabel: { fontSize: 13, color: colors.muted, flex: 1 }, lineValue: { fontSize: 14, fontWeight: '700', color: colors.ink, flexShrink: 1, textAlign: 'right' },
  progress: { height: 6, backgroundColor: colors.soft, borderRadius: 6, overflow: 'hidden', marginVertical: 4 }, progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(23,36,78,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }, dialog: { width: '100%', maxWidth: 480, maxHeight: '85%', flexGrow: 0, backgroundColor: colors.surface, borderRadius: 12 }, dialogContent: { padding: 24, gap: 18 },
});
