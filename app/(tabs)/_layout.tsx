// A05, slide 17: Tabs com Ionicons, adaptadas às cinco abas do Pulso.
import { Tabs, Redirect } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nativeDriver, useReducedMotion } from "../../src/design/motion";
import { useSessao } from "../../src/servicos/api";
import { motion } from "../../src/design/theme";

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const toValue = focused ? 1.08 : 1;
    if (reduced) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }
    const animation = Animated.timing(scale, {
      toValue,
      duration: motion.tab,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, scale]);
  return (
    <Animated.View
      accessible={false}
      accessibilityElementsHidden
      style={{ transform: [{ scale }] }}
    >
      <Ionicons
        aria-hidden
        accessible={false}
        name={name}
        color={color}
        size={23}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, fontsReady } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const pessoa = useSessao();
  if (!pessoa) return <Redirect href="/entrar" />;
  if (pessoa.perfil_completo === false)
    return <Redirect href="/completar-perfil" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reduced ? "none" : "fade",
        transitionSpec: {
          animation: "timing",
          config: { duration: motion.tab },
        },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 66 + Math.max(8, insets.bottom),
          paddingTop: 10,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarAccessibilityLabel: "Início",
          tabBarIcon: (props) => <TabIcon {...props} name="home-outline" />,
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: "Campanhas",
          tabBarLabel: "Causas",
          tabBarAccessibilityLabel: "Campanhas",
          tabBarIcon: (props) => <TabIcon {...props} name="search-outline" />,
        }}
      />
      <Tabs.Screen
        name="criar"
        options={{
          title: "Criar",
          tabBarAccessibilityLabel: "Criar",
          tabBarIcon: (props) => (
            <TabIcon {...props} name="add-circle-outline" />
          ),
        }}
      />
      <Tabs.Screen name="rotas" options={{ href: null }} />
      <Tabs.Screen
        name="atividade"
        options={{
          title: "Atividade",
          tabBarAccessibilityLabel: "Atividade",
          tabBarIcon: (props) => <TabIcon {...props} name="heart-outline" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarAccessibilityLabel: "Perfil",
          tabBarIcon: (props) => <TabIcon {...props} name="person-outline" />,
        }}
      />
    </Tabs>
  );
}
