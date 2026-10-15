import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { motion, useDesign } from './theme';
import { nativeDriver, useReducedMotion } from './motion';

// The same 100-unit geometry is used by the exported SVG and Expo icons.
export function BrandMark({ size = 40, color, construction }: { size?: number; color?: string; construction?: Animated.Value }) {
  const { colors, dark } = useDesign(); const unit = size / 100; const fill = color || colors.hero;
  const rectangles = [[20, 20, 44, 18], [20, 38, 18, 26], [36, 62, 44, 18], [62, 36, 18, 26]];
  const shape = (original: number, heart: number) => construction ? construction.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [original * unit, original * unit, heart * unit, original * unit] }) : original * unit;
  return <View accessible={false} style={{ width: size, height: size, backgroundColor: dark && !color ? '#FFFEFB' : undefined, borderRadius: size * .2 }}>
    {/* The same four pieces travel through the logo, plus, heart, and back to the logo. */}
    {[0, 1].map(group => <Animated.View key={group} style={[StyleSheet.absoluteFill, construction ? { transform: [{ translateX: construction.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, (group ? -21 : 21) * unit, 0, 0] }) }, { translateY: construction.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, (group ? -21 : 21) * unit, 0, 0] }) }, { rotate: construction.interpolate({ inputRange: [0, 1, 2, 3], outputRange: ['0deg', '0deg', group ? '45deg' : '-45deg', '0deg'] }) }] } : undefined]}>
      {rectangles.slice(group * 2, group * 2 + 2).map(([left, top, width, height], index) => {
        const cap = group === 0 ? index === 0 : index === 1;
        // Two rounded columns meet at (50, 81) after opposing 45-degree rotations.
        const heartLeft = group ? 50 + 31 * Math.SQRT1_2 - 40 : 50 - 31 * Math.SQRT1_2;
        const heartTop = 50 + 31 * Math.SQRT1_2 - 64;
        return <Animated.View key={index} style={{ position: 'absolute', left: shape(left, heartLeft), top: shape(top, heartTop + (cap ? 0 : 40)), width: shape(width, 40), height: shape(height, cap ? 40 : 24), backgroundColor: fill, borderTopLeftRadius: shape(group === 0 && index === 0 ? 4 : 0, cap ? 20 : 0), borderTopRightRadius: shape(0, cap ? 20 : 0), borderBottomRightRadius: shape(group === 1 && index === 0 ? 4 : 0, 0) }}/>;
      })}
    </Animated.View>)}
  </View>;
}

export function BrandSignature({ inverse = false, size = 40 }: { inverse?: boolean; size?: number }) {
  const { colors, fontsReady } = useDesign();
  return <View accessible accessibilityLabel="SOMA" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><BrandMark size={size} color={inverse ? colors.onHero : undefined}/><Text style={{ color: inverse ? colors.onHero : colors.ink, fontSize: size * 0.85, letterSpacing: -size * 0.035, fontFamily: fontsReady ? 'Sora-SemiBold' : undefined, fontWeight: fontsReady ? '400' : '700' }}>soma</Text></View>;
}

export function BrandIntroduction() {
  const reduced = useReducedMotion(); const path = usePathname(); const initialPath = useRef(path); const played = useRef(false);
  const build = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(false); const { colors, fontsReady } = useDesign();
  useEffect(() => {
    if (reduced || path !== initialPath.current) { setVisible(false); return; }
    if (played.current) return;
    played.current = true; setVisible(true);
    // Shape dimensions and corner radii require the JS driver; only four pieces are animated.
    const morph = (toValue: number, duration: number) => Animated.timing(build, { toValue, duration, easing: Easing.bezier(.4, 0, .2, 1), useNativeDriver: false });
    const animation = Animated.sequence([
      Animated.delay(200),
      morph(1, 650),
      Animated.delay(200),
      morph(2, 700),
      Animated.delay(350),
      morph(3, 700),
      Animated.delay(250),
      Animated.timing(opacity, { toValue: 0, duration: motion.introduction - 3050, useNativeDriver: nativeDriver }),
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
