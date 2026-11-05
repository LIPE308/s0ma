import { useEffect, useState } from "react";
import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { Platform, View } from "react-native";
import { DesignProvider, motion } from "../src/design/theme";
import {
  MotionProvider,
  NavigationMotion,
  ThemeMotion,
  useReducedMotion,
} from "../src/design/motion";
import { BrandSignature } from "../src/design/brand";
import { useTheme } from "../src/components/ui";
import { recuperarSessaoNativa } from "../src/servicos/api";
import { verificarAtualizacoesNaAbertura } from "../src/servicos/atualizacoes";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsReady, error] = useFonts({
    "Manrope-Regular": require("../assets/fonts/Manrope-Regular.ttf"),
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Sora-SemiBold": require("../assets/fonts/Sora-SemiBold.ttf"),
  });
  const [fallback, setFallback] = useState(false);
  const [sessaoPronta, definirSessaoPronta] = useState(false);
  useEffect(() => {
    void recuperarSessaoNativa().finally(() => definirSessaoPronta(true));
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setFallback(true), 3000);
    return () => clearTimeout(timeout);
  }, []);
  const ready = (fontsReady || !!error || fallback) && sessaoPronta;
  return (
    <DesignProvider fontsReady={fontsReady}>
      <MotionProvider>
        <Application ready={ready} />
      </MotionProvider>
    </DesignProvider>
  );
}

function Application({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const routeKey = pathname + JSON.stringify(params);
  const { colors, dark, temaPronto } = useTheme();
  const reduced = useReducedMotion();
  const pronto = ready && temaPronto;
  useEffect(() => {
    if (pronto) void verificarAtualizacoesNaAbertura();
  }, [pronto]);
  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);
  useEffect(() => {
    if (Platform.OS !== "web")
      void SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);
  return (
    <ThemeMotion
      testID="theme-motion"
      themeKey={dark ? "dark" : "light"}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <StatusBar style={dark ? "light" : "dark"} />
      {pronto ? (
        <NavigationMotion routeKey={routeKey}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: reduced ? "none" : "fade_from_bottom",
              animationDuration: motion.navigation,
              animationTypeForReplace: "push",
            }}
          />
        </NavigationMotion>
      ) : (
        <View
          accessibilityLabel="Carregando SOMA"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <BrandSignature size={64} />
        </View>
      )}
    </ThemeMotion>
  );
}
