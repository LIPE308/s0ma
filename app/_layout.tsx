import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { DesignProvider } from '../src/design/theme';
import { MotionProvider, useReducedMotion } from '../src/design/motion';
import { BrandIntroduction, BrandSignature } from '../src/design/brand';
import { useTheme } from '../src/components/ui';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsReady, error] = useFonts({
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Sora-SemiBold': require('../assets/fonts/Sora-SemiBold.ttf'),
  });
  const [fallback, setFallback] = useState(false);
  useEffect(() => { const timeout = setTimeout(() => setFallback(true), 3000); return () => clearTimeout(timeout); }, []);
  const ready = fontsReady || !!error || fallback;
  useEffect(() => { if (ready) void SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  return <DesignProvider fontsReady={fontsReady}><MotionProvider><Application ready={ready}/></MotionProvider></DesignProvider>;
}

function Application({ ready }: { ready: boolean }) {
  const { colors, dark } = useTheme(); const reduced = useReducedMotion();
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><StatusBar style={dark ? 'light' : 'dark'}/>{ready ? <><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: reduced ? 'none' : 'slide_from_right', animationDuration: 220 }}/><BrandIntroduction/></> : <View accessibilityLabel="Carregando SOMA" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><BrandSignature size={64}/></View>}</View>;
}
