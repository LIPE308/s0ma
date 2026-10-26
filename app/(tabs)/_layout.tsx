// A05, slide 17: Tabs com Ionicons, adaptadas às cinco abas do Pulso.
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nativeDriver, useReducedMotion } from '../../src/design/motion';
import { motion } from '../../src/design/theme';

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  const reduced = useReducedMotion(); const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const toValue = focused ? 1.08 : 1;
    if (reduced) { scale.stopAnimation(); scale.setValue(1); return; }
    const animation = Animated.timing(scale, { toValue, duration: motion.tab, useNativeDriver: nativeDriver });
    animation.start(); return () => animation.stop();
  }, [focused, reduced, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}><Ionicons name={name} color={color} size={23}/></Animated.View>;
}

export default function TabLayout() {
  const { colors, fontsReady } = useTheme(); const insets = useSafeAreaInsets(); const reduced = useReducedMotion();
  return <Tabs screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade', transitionSpec: { animation: 'timing', config: { duration: motion.tab } }, sceneStyle: { backgroundColor: colors.bg }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 66 + Math.max(8, insets.bottom), paddingTop: 10, paddingBottom: Math.max(8, insets.bottom) }, tabBarLabelStyle: { fontSize: 11, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined } }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: props => <TabIcon {...props} name="home-outline"/> }}/>
    <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: props => <TabIcon {...props} name="search-outline"/> }}/>
    <Tabs.Screen name="criar" options={{ title: 'Criar', tabBarIcon: props => <TabIcon {...props} name="add-circle-outline"/> }}/>
    <Tabs.Screen name="rotas" options={{ title: 'Minhas rotas', tabBarIcon: props => <TabIcon {...props} name="navigate-outline"/> }}/><Tabs.Screen name="atividade" options={{ href: null }}/>
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: props => <TabIcon {...props} name="person-outline"/> }}/>
  </Tabs>;
}
