import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { motion, useDesign } from './theme';
import { nativeDriver, useReducedMotion } from './motion';

// The same 100-unit geometry is used by the exported SVG and Expo icons.
export function BrandMark({ size = 40, color, construction }: { size?: number; color?: string; construction?: Animated.Value }) {
  const { colors } = useDesign(); const unit = size / 100; const fill = color || colors.primary;
  const rectangles = [[20, 20, 44, 18], [20, 38, 18, 26], [36, 62, 44, 18], [62, 36, 18, 26]];
  return <View accessible={false} style={{ width: size, height: size }}>
    {[0, 1].map(group => <Animated.View key={group} style={[StyleSheet.absoluteFill, construction ? { opacity: construction, transform: [{ translateX: construction.interpolate({ inputRange: [0, 1], outputRange: [group ? 16 : -16, 0] }) }, { translateY: construction.interpolate({ inputRange: [0, 1], outputRange: [group ? 10 : -10, 0] }) }] } : undefined]}>
      {rectangles.slice(group * 2, group * 2 + 2).map(([left, top, width, height], index) => <View key={index} style={{ position: 'absolute', left: left * unit, top: top * unit, width: width * unit, height: height * unit, backgroundColor: fill, borderTopLeftRadius: group === 0 && index === 0 ? 4 * unit : 0, borderBottomRightRadius: group === 1 && index === 0 ? 4 * unit : 0 }}/>) }
    </Animated.View>)}
  </View>;
}

export function BrandSignature({ inverse = false, size = 40 }: { inverse?: boolean; size?: number }) {
  const { colors, fontsReady } = useDesign();
  return <View accessible accessibilityLabel="SOMA" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><BrandMark size={size} color={inverse ? colors.onHero : colors.primary}/><Text style={{ color: inverse ? colors.onHero : colors.ink, fontSize: size * 0.85, letterSpacing: -size * 0.035, fontFamily: fontsReady ? 'Sora-SemiBold' : undefined, fontWeight: fontsReady ? '400' : '700' }}>soma</Text></View>;
}

export function BrandIntroduction() {
  const reduced = useReducedMotion(); const path = usePathname(); const initialPath = useRef(path); const played = useRef(false);
  const build = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(false); const { colors, fontsReady } = useDesign();
  useEffect(() => {
    if (reduced || path !== initialPath.current) { setVisible(false); return; }
    if (played.current) return;
    played.current = true; setVisible(true);
    const animation = Animated.sequence([
      Animated.timing(build, { toValue: 1, duration: 1100, easing: Easing.bezier(.22, 1, .36, 1), useNativeDriver: nativeDriver }),
      Animated.delay(400),
      Animated.timing(opacity, { toValue: 0, duration: motion.introduction - 1500, useNativeDriver: nativeDriver }),
    ]);
    animation.start(() => setVisible(false));
    return () => animation.stop();
  }, [reduced, path, build, opacity]);
  if (!visible || reduced) return null;
  return <Animated.View testID="brand-introduction" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { opacity, backgroundColor: colors.hero, alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
    <BrandMark size={160} color={colors.onHero} construction={build}/>
    <Text style={{ fontFamily: fontsReady ? 'Sora-SemiBold' : undefined, fontSize: 46, fontWeight: fontsReady ? '400' : '700', letterSpacing: -2, color: colors.onHero }}>soma</Text>
    <Text style={{ color: colors.onHero, fontSize: 14, fontFamily: fontsReady ? 'Manrope-Regular' : undefined }}>Toda ajuda conta.</Text>
  </Animated.View>;
}
