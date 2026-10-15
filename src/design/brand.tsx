import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { motion, useDesign } from './theme';
import { nativeDriver, useReducedMotion } from './motion';

// The same 100-unit geometry is used by the exported SVG and Expo icons.
export function BrandMark({ size = 40, color, construction }: { size?: number; color?: string; construction?: Animated.Value }) {
  const { colors, dark, fontsReady } = useDesign(); const unit = size / 100; const fill = color || colors.hero;
  const rectangles = [[20, 20, 44, 18], [20, 38, 18, 26], [36, 62, 44, 18], [62, 36, 18, 26]];
  const wordCenters = [-10, 30, 70, 110];
  const unfold = construction?.interpolate({ inputRange: [0, 2, 3, 4, 5], outputRange: [0, 0, 1, 0, 0] });
  const shape = (original: number, heart: number) => construction ? construction.interpolate({ inputRange: [0, 1, 2, 3, 4, 5], outputRange: [heart, original, original, original, original, heart].map(value => value * unit) }) : original * unit;
  return <View testID={construction ? 'brand-mark-morph' : undefined} accessible={false} style={{ width: size, height: size, backgroundColor: dark && !color ? '#FFFEFB' : undefined, borderRadius: size * .2 }}>
    {/* Heart → plus → box → four letters → box → heart closes the cycle. */}
    {[0, 1].map(group => <Animated.View key={group} style={[StyleSheet.absoluteFill, construction ? { transform: [{ translateX: construction.interpolate({ inputRange: [0, 1, 2, 5], outputRange: [0, (group ? -21 : 21) * unit, 0, 0] }) }, { translateY: construction.interpolate({ inputRange: [0, 1, 2, 5], outputRange: [0, (group ? -21 : 21) * unit, 0, 0] }) }, { rotate: construction.interpolate({ inputRange: [0, 1, 4, 5], outputRange: [group ? '45deg' : '-45deg', '0deg', '0deg', group ? '45deg' : '-45deg'] }) }] } : undefined]}>
      {rectangles.slice(group * 2, group * 2 + 2).map(([left, top, width, height], index) => {
        const cap = group === 0 ? index === 0 : index === 1;
        // Two rounded columns meet at (50, 81) after opposing 45-degree rotations.
        const heartLeft = group ? 50 + 31 * Math.SQRT1_2 - 40 : 50 - 31 * Math.SQRT1_2;
        const heartTop = 50 + 31 * Math.SQRT1_2 - 64;
        return <Animated.View key={index} style={{ position: 'absolute', left: shape(left, heartLeft), top: shape(top, heartTop + (cap ? 0 : 40)), width: shape(width, 40), height: shape(height, cap ? 40 : 24), backgroundColor: fill, borderTopLeftRadius: shape(group === 0 && index === 0 ? 4 : 0, cap ? 20 : 0), borderTopRightRadius: shape(0, cap ? 20 : 0), borderBottomRightRadius: shape(group === 1 && index === 0 ? 4 : 0, 0), ...(unfold ? { opacity: unfold.interpolate({ inputRange: [0, .35, .8, 1], outputRange: [1, 1, 0, 0] }), transform: [{ translateX: unfold.interpolate({ inputRange: [0, 1], outputRange: [0, (group ? 40 : -40) * unit] }) }] } : {}) }}/>;
      })}
    </Animated.View>)}
    {unfold ? 'SOMA'.split('').map((letter, index) => {
      const originX = index < 2 ? 42 : 58;
      return <Animated.Text key={letter} testID={'brand-letter-' + letter} style={{ position: 'absolute', left: (wordCenters[index] - 20) * unit, top: 15 * unit, width: 40 * unit, lineHeight: 70 * unit, fontSize: 36 * unit, fontFamily: fontsReady ? 'Sora-SemiBold' : undefined, fontWeight: fontsReady ? '400' : '700', color: fill, textAlign: 'center', includeFontPadding: false, opacity: unfold.interpolate({ inputRange: [0, .25, .8, 1], outputRange: [0, 0, 1, 1] }), transform: [{ translateX: unfold.interpolate({ inputRange: [0, 1], outputRange: [(originX - wordCenters[index]) * unit, 0] }) }, { scale: unfold.interpolate({ inputRange: [0, 1], outputRange: [.45, 1] }) }] }}>{letter}</Animated.Text>;
    }) : null}
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
      Animated.delay(250),
      morph(1, 600),
      Animated.delay(200),
      morph(2, 600),
      Animated.delay(200),
      morph(3, 900),
      Animated.delay(650),
      morph(4, 800),
      Animated.delay(150),
      morph(5, 650),
      Animated.delay(250),
      Animated.timing(opacity, { toValue: 0, duration: motion.introduction - 5250, useNativeDriver: nativeDriver }),
    ]);
    animation.start(() => setVisible(false));
    return () => animation.stop();
  }, [reduced, path, build, opacity]);
  if (!visible || reduced) return null;
  return <Animated.View testID="brand-introduction" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { opacity, backgroundColor: colors.hero, alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
    <View style={{ width: 280, height: 160, alignItems: 'center' }}><BrandMark size={160} color={colors.onHero} construction={build}/></View>
    <Text style={{ color: colors.onHero, fontSize: 14, fontFamily: fontsReady ? 'Manrope-Regular' : undefined }}>Toda ajuda conta.</Text>
  </Animated.View>;
}
