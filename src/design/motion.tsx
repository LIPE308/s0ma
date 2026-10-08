import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type ViewProps } from 'react-native';
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
  useEffect(() => {
    if (reduced) { value.stopAnimation(); value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: motion.content, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver });
    animation.start(); return () => animation.stop();
  }, [reduced, value]);
  return <Animated.View {...props} style={[style, { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>{children}</Animated.View>;
}
