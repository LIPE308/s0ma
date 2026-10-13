import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { motion } from './theme';

// Start static until the system preference is known; never assume animation is allowed.
const MotionContext = createContext(true);
export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(preference.matches);
      update(); preference.addEventListener('change', update);
      return () => preference.removeEventListener('change', update);
    }
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => setReduced(value));
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  return <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>;
}
export const useReducedMotion = () => useContext(MotionContext);
export const nativeDriver = Platform.OS !== 'web';

export function ContentMotion({ children, style, ...props }: ViewProps) {
  const reduced = useReducedMotion(); const value = useRef(new Animated.Value(1)).current;
  useFocusEffect(useCallback(() => {
    if (reduced) { value.stopAnimation(); value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: motion.content, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver });
    animation.start(); return () => animation.stop();
  }, [reduced, value]));
  return <Animated.View {...props} style={[style, { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>{children}</Animated.View>;
}

export function MotionPressable({ containerStyle, onPressIn, onPressOut, disabled, ...props }: PressableProps & { containerStyle?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion(); const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => {
    scale.stopAnimation();
    if (reduced || disabled) { scale.setValue(1); return; }
    Animated.timing(scale, { toValue: value, duration: motion.press, useNativeDriver: nativeDriver }).start();
  };
  useEffect(() => { if (reduced || disabled) { scale.stopAnimation(); scale.setValue(1); } }, [disabled, reduced, scale]);
  return <Animated.View style={[containerStyle, { transform: [{ scale }] }]}><Pressable {...props} disabled={disabled} onPressIn={event => { animate(.98); onPressIn?.(event); }} onPressOut={event => { animate(1); onPressOut?.(event); }}/></Animated.View>;
}

export function EntryMotion({ children, style, ...props }: ViewProps) {
  const reduced = useReducedMotion(); const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    value.stopAnimation();
    if (reduced) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: motion.content, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver });
    animation.start(); return () => animation.stop();
  }, [reduced, value]);
  return <Animated.View {...props} style={[style, { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [.7, 1] }), transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [.98, 1] }) }] }]}>{children}</Animated.View>;
}

export function ThemeMotion({ themeKey, children, style, ...props }: ViewProps & { themeKey: string }) {
  const reduced = useReducedMotion(); const opacity = useRef(new Animated.Value(1)).current; const previous = useRef(themeKey);
  useEffect(() => {
    opacity.stopAnimation();
    if (reduced || previous.current === themeKey) { opacity.setValue(1); previous.current = themeKey; return; }
    previous.current = themeKey; opacity.setValue(.8);
    const animation = Animated.timing(opacity, { toValue: 1, duration: motion.theme, useNativeDriver: nativeDriver });
    animation.start(); return () => animation.stop();
  }, [opacity, reduced, themeKey]);
  return <Animated.View {...props} style={[style, { opacity }]}>{children}</Animated.View>;
}
