import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, BrandSignature } from '../design/brand';
import { ContentMotion, EntryMotion, MotionPressable, useReducedMotion } from '../design/motion';
import { radius, useDesign, type Colors } from '../design/theme';

export function useTheme() {
  const design = useDesign();
  const s = useMemo(() => createStyles(design.colors, design.fontsReady), [design.colors, design.fontsReady]);
  return { ...design, s };
}
export function Logo() { return <BrandSignature/>; }
type ScreenVariant = 'editorial' | 'form' | 'account' | 'detail' | 'ledger';

export function Screen({ title, heading, subtitle, children, back = true, step, action, variant = 'editorial' }: { title: string; heading?: string; subtitle?: string; children: ReactNode; back?: boolean; step?: string; action?: ReactNode; variant?: ScreenVariant }) {
  const router = useRouter(); const { s, colors } = useTheme(); const insets = useSafeAreaInsets();
  const form = variant === 'form' || variant === 'account';
  const currentStep = step ? Number(step.match(/\d+/)?.[0]) : 0;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, form && s.formContent, { paddingTop: Math.max(24, insets.top + 12), paddingBottom: Math.max(32, insets.bottom + 20) }]}>
      <View style={s.demo}><View style={s.dot}/><Text style={s.demoText}>AMBIENTE ACADÊMICO · DADOS LOCAIS</Text></View>
      <View style={s.header}>
        <View style={[s.row, { flex: 1, minWidth: 0 }]}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => [s.back, pressed && s.pressed]}><Ionicons name="arrow-back" size={22} color={colors.primary}/></Pressable> : null}{title === 'soma' ? <Logo/> : <Text style={s.headerTitle}>{title}</Text>}</View>
        {action}
      </View>
      {step ? <View style={s.stepper}><Text style={s.eyebrow}>{step}</Text><View accessible={false} style={s.stepSegments}>{[1, 2, 3, 4].map(number => <View key={number} style={[s.stepSegment, number <= currentStep && { backgroundColor: colors.primary }]}/>)}</View></View> : null}
      {variant === 'account' ? <View style={s.authHero}><BrandMark size={44} color={colors.primary}/>{heading ? <Text accessibilityRole="header" style={[s.heading, { marginTop: 10, fontSize: 28, lineHeight: 36 }]}>{heading}</Text> : null}{subtitle ? <Text style={[s.subtitle, { marginBottom: 0 }]}>{subtitle}</Text> : null}</View> : <View style={variant === 'detail' ? s.detailHeading : undefined}>
        {heading ? <Text accessibilityRole="header" style={s.heading}>{heading}</Text> : null}
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>}
      <ContentMotion testID="screen-content" style={[s.body, form && s.formBody]}>{children}</ContentMotion>
      <View style={s.footer}><BrandMark size={24}/><Text style={s.footerText}>Toda ajuda conta.</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

export function Button({ title, onPress, secondary = false, disabled = false, danger = false, inverse = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; danger?: boolean; inverse?: boolean }) {
  const { s } = useTheme();
  return <MotionPressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, danger && s.danger, inverse && s.inverseButton, disabled && s.disabled, pressed && s.pressed]}>
    <Text style={[s.buttonText, secondary && s.secondaryText, danger && s.dangerText, inverse && s.inverseButtonText]}>{title}</Text>
  </MotionPressable>;
}

export function Field({ label, value, onChangeText, placeholder, secret, multiline, numeric, email }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secret?: boolean; multiline?: boolean; numeric?: boolean; email?: boolean }) {
  const { s, colors } = useTheme(); const [focused, setFocused] = useState(false);
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChangeText} secureTextEntry={secret} multiline={multiline} keyboardType={numeric ? 'numeric' : email ? 'email-address' : 'default'} autoCapitalize={email || secret ? 'none' : 'sentences'} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} selectionColor={colors.primary} style={[s.input, multiline && s.multiline, focused && { borderColor: colors.primary }]}/></View>;
}

export function Copy({ children, muted = false, inverse = false }: { children: ReactNode; muted?: boolean; inverse?: boolean }) { const { s } = useTheme(); return <Text style={[s.copy, muted && s.muted, inverse && s.inverse]}>{children}</Text>; }
export function Heading({ children }: { children: ReactNode }) { const { s } = useTheme(); return <Text accessibilityRole="header" style={s.sectionTitle}>{children}</Text>; }
export function Tag({ children }: { children: ReactNode }) { const { s } = useTheme(); return <View style={s.tag}><Text style={s.tagText}>{children}</Text></View>; }
export function Notice({ children, error = false, success = false }: { children: ReactNode; error?: boolean; success?: boolean }) {
  const { s, colors } = useTheme();
  return <EntryMotion style={[s.notice, error && s.error, success && { backgroundColor: colors.successBg }]}><Ionicons name={error ? 'alert-circle-outline' : success ? 'checkmark-circle-outline' : 'information-circle-outline'} size={20} color={error ? colors.error : success ? colors.success : colors.primary}/><Text accessibilityLiveRegion="polite" style={[s.noticeText, error && s.errorText, success && { color: colors.success }]}>{children}</Text></EntryMotion>;
}

export function EmptyState({ title, children, action, onPress }: { title: string; children: ReactNode; action?: string; onPress?: () => void }) {
  const { s, colors } = useTheme();
  return <View style={{ padding: 22, borderRadius: radius.card, backgroundColor: colors.gentle, gap: 12 }}><Ionicons name="leaf-outline" size={28} color={colors.gentleInk}/><Text accessibilityRole="header" style={s.cardTitle}>{title}</Text><Copy>{children}</Copy>{action && onPress ? <Button secondary title={action} onPress={onPress}/> : null}</View>;
}

export function Card({ title, subtitle, children, onPress, icon = 'heart-outline', variant }: { title: string; subtitle?: string; children?: ReactNode; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: 'panel' | 'row' | 'feature' }) {
  const { s, colors } = useTheme(); const mode = variant || (onPress ? 'row' : 'panel'); const feature = mode === 'feature';
  const contents = <><View style={s.cardTop}><View style={[s.icon, feature && s.featureIcon]}><Ionicons name={icon} size={21} color={feature ? colors.onHero : colors.primary}/></View><Text style={[s.cardTitle, feature && s.featureTitle]}>{title}</Text>{onPress && !feature ? <Ionicons name="chevron-forward" size={18} color={colors.primary}/> : null}</View>{subtitle ? <Text style={[s.cardSubtitle, feature && s.inverse]}>{subtitle}</Text> : null}{children}</>;
  const styles = [s.card, mode === 'row' && s.cardRow, feature && s.feature];
  return onPress ? <MotionPressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint="Abrir detalhes" onPress={onPress} style={({ pressed }) => [...styles, pressed && s.pressed]}>{contents}</MotionPressable> : <View style={styles}>{contents}</View>;
}

export function Choices({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (value: string) => void }) {
  const { s } = useTheme();
  return <View style={s.choices}>{options.map(option => <MotionPressable containerStyle={{ flexGrow: 1 }} accessibilityRole="button" accessibilityState={{ selected: selected === option }} {...(Platform.OS === 'web' ? { 'aria-pressed': selected === option } : {})} key={option} onPress={() => onSelect(option)} style={({ pressed }) => [s.choice, selected === option && s.choiceActive, pressed && s.pressed]}><Text style={[s.choiceText, selected === option && s.choiceTextActive]}>{option}</Text></MotionPressable>)}</View>;
}
export function Line({ label, value }: { label: string; value: string }) { const { s } = useTheme(); return <View style={s.line}><Text style={s.lineLabel}>{label}</Text><Text style={s.lineValue}>{value}</Text></View>; }
export function Metric({ label, value }: { label: string; value: string }) { const { s } = useTheme(); return <View style={s.metric}><Text style={[s.eyebrow, s.inverse]}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>; }
export function Progress({ done, total, inverse = false }: { done: number; total: number; inverse?: boolean }) {
  const { s, colors } = useTheme(); const percent = total > 0 && Number.isFinite(done / total) ? Math.max(0, Math.min(100, done / total * 100)) : 0;
  return <View accessibilityRole="progressbar" accessibilityLabel="Meta realizada" accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }} style={[s.progress, inverse && { backgroundColor: colors.heroTrack }]}><View style={[s.progressFill, { width: `${percent}%`, backgroundColor: inverse ? colors.onHero : colors.primary }]}/></View>;
}
export function Dialog({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const { s, colors } = useTheme(); const reduced = useReducedMotion();
  return <Modal visible={visible} animationType={reduced ? 'none' : 'fade'} transparent onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}><ScrollView keyboardShouldPersistTaps="handled" accessibilityViewIsModal style={s.dialog} contentContainerStyle={s.dialogContent}>{visible ? <EntryMotion style={{ gap: 20 }}><View style={s.header}><Text accessibilityRole="header" style={[s.sectionTitle, { flex: 1 }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar janela" onPress={onClose} style={s.back}><Ionicons name="close" color={colors.ink} size={24}/></Pressable></View>{children}</EntryMotion> : null}</ScrollView></KeyboardAvoidingView></Modal>;
}

function createStyles(colors: Colors, fontsReady: boolean) {
  const regular = { fontFamily: fontsReady ? 'Manrope-Regular' : undefined };
  const strong = { fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined, fontWeight: (fontsReady ? '400' : '600') as '400' | '600' };
  const display = { fontFamily: fontsReady ? 'Sora-SemiBold' : undefined, fontWeight: (fontsReady ? '400' : '700') as '400' | '700' };
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 32 }, formContent: { maxWidth: 620 },
    demo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, demoText: { ...strong, fontSize: 11, color: colors.muted, letterSpacing: .7 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 28 }, headerTitle: { ...strong, color: colors.ink, fontSize: 16, flexShrink: 1 }, back: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heading: { ...display, fontSize: 30, color: colors.ink, lineHeight: 39, letterSpacing: -1, marginBottom: 12 }, subtitle: { ...regular, fontSize: 15, color: colors.muted, lineHeight: 24, marginBottom: 24 }, detailHeading: { paddingBottom: 12, marginBottom: 12 }, eyebrow: { ...strong, color: colors.gentleInk, fontSize: 12, letterSpacing: .8, marginBottom: 12 }, body: { gap: 20 }, formBody: { backgroundColor: colors.surface, padding: 20, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line },
    authHero: { backgroundColor: colors.gentle, padding: 24, borderRadius: radius.hero, marginBottom: 20 }, inverse: { color: colors.onHero },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 32 }, footerText: { ...regular, fontSize: 12, color: colors.muted },
    stepper: { marginBottom: 24 }, stepSegments: { flexDirection: 'row', gap: 8 }, stepSegment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.line },
    button: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.control, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary }, buttonText: { ...strong, color: colors.onPrimary, fontSize: 15, textAlign: 'center' }, secondary: { backgroundColor: colors.surface, borderColor: colors.line }, secondaryText: { color: colors.primary }, disabled: { opacity: .45 }, pressed: { opacity: .8 }, danger: { backgroundColor: colors.errorBg, borderColor: colors.error }, dangerText: { color: colors.error }, inverseButton: { backgroundColor: colors.onHero, borderColor: colors.onHero }, inverseButtonText: { color: colors.hero },
    field: { gap: 8 }, label: { ...strong, color: colors.ink, fontSize: 14 }, input: { ...regular, minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, fontSize: 16, color: colors.ink }, multiline: { minHeight: 120, textAlignVertical: 'top', lineHeight: 25 },
    copy: { ...regular, color: colors.ink, fontSize: 15, lineHeight: 25, flexShrink: 1 }, muted: { color: colors.muted }, sectionTitle: { ...display, fontSize: 20, lineHeight: 28, color: colors.ink, letterSpacing: -.5 },
    tag: { backgroundColor: colors.soft, borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7 }, tagText: { ...strong, fontSize: 12, color: colors.primary }, notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, backgroundColor: colors.soft }, noticeText: { ...regular, flex: 1, fontSize: 14, lineHeight: 23, color: colors.ink }, error: { backgroundColor: colors.errorBg }, errorText: { color: colors.error },
    card: { padding: 20, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, gap: 12 }, cardRow: { padding: 18, gap: 10 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, cardTitle: { ...strong, fontSize: 17, lineHeight: 24, color: colors.ink, flex: 1 }, icon: { backgroundColor: colors.gentle, borderRadius: 14, padding: 9 }, cardSubtitle: { ...regular, fontSize: 14, color: colors.muted, lineHeight: 23 }, feature: { backgroundColor: colors.hero, padding: 24, borderRadius: radius.hero, gap: 16 }, featureIcon: { backgroundColor: colors.heroWash }, featureTitle: { ...display, color: colors.onHero, fontSize: 25, lineHeight: 32, letterSpacing: -.8 },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { flexGrow: 1, paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }, choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary }, choiceText: { ...strong, fontSize: 13, color: colors.ink }, choiceTextActive: { color: colors.onPrimary },
    line: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.line }, lineLabel: { ...regular, fontSize: 14, color: colors.muted, flexGrow: 1, flexBasis: 120 }, lineValue: { ...strong, fontSize: 16, color: colors.ink, flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] }, metric: { backgroundColor: colors.hero, padding: 24, borderRadius: 20, gap: 8 }, metricValue: { ...display, fontSize: 34, lineHeight: 44, letterSpacing: -1, color: colors.onHero, fontVariant: ['tabular-nums'] },
    progress: { height: 6, backgroundColor: colors.soft, borderRadius: 6, overflow: 'hidden', marginVertical: 4 }, progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 6 },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }, dialog: { width: '100%', maxWidth: 520, maxHeight: '88%', flexGrow: 0, backgroundColor: colors.surface, borderRadius: 24 }, dialogContent: { padding: 20, gap: 20 },
  });
}
