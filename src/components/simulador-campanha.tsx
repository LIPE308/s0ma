import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Animated, AppState, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, useTheme } from "./ui";
import { nativeDriver, useReducedMotion } from "../design/motion";
import { formatarDinheiro } from "../data/formatacao";

// Cenário didático isolado: nunca grava pagamentos, rendimentos ou saldo no banco.
export function SimuladorCampanha({
  automatico = false,
}: {
  automatico?: boolean;
}) {
  const { colors, fontsReady } = useTheme();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(automatico);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(AppState.currentState === "active");
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!running || !focused || !active) return;
    const timer = setInterval(() => setStep((s) => Math.min(60, s + 1)), 2000);
    return () => clearInterval(timer);
  }, [running, focused, active]);
  useEffect(() => {
    if (reduced || !step) return;
    pulse.setValue(1);
    const animation = Animated.timing(pulse, {
      toValue: 0,
      duration: 500,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [step, reduced, pulse]);
  useEffect(() => {
    if (step === 60) setRunning(false);
  }, [step]);
  const doacoes = Math.floor(step / 4) * 2500,
    anuncios = step * 12,
    rendimento = step;
  return (
    <View
      testID="campaign-money-demo"
      style={{
        backgroundColor: colors.hero,
        borderRadius: 24,
        padding: 24,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="trending-up" color={colors.onHero} size={26} />
        <Text
          style={{
            color: colors.onHero,
            fontSize: 16,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
          }}
        >
          Veja sua campanha ganhar força
        </Text>
      </View>
      <Text style={{ color: colors.onHero, fontSize: 13 }}>
        Saldo projetado
      </Text>
      <Animated.Text
        testID="demo-money-total"
        style={{
          color: colors.onHero,
          fontSize: 36,
          lineHeight: 48,
          fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.035],
              }),
            },
          ],
        }}
      >
        {formatarDinheiro((10000 + doacoes + anuncios + rendimento) / 100)}
      </Animated.Text>
      <Text style={{ color: colors.onHero, fontSize: 14, lineHeight: 22 }}>
        Projeção a partir de R$ 100,00. Acompanhe a evolução:
      </Text>
      {[
        ["Doações previstas", doacoes],
        ["Receita de anúncios prevista", anuncios],
        ["Rendimento projetado", rendimento],
      ].map(([label, value]) => (
        <View
          key={String(label)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ color: colors.onHero, fontSize: 13, flex: 1 }}>
            {label}
          </Text>
          <Text style={{ color: colors.onHero, fontSize: 14 }}>
            + {formatarDinheiro(Number(value) / 100)}
          </Text>
        </View>
      ))}
      <Text style={{ color: colors.onHero, fontSize: 12, lineHeight: 19 }}>
        Estimativa de evolução. O saldo registrado da campanha aparece
        separadamente.
      </Text>
      <Button
        inverse
        title={
          step === 60
            ? "Reiniciar projeção"
            : running
              ? "Pausar evolução"
              : "Ver valores em movimento"
        }
        onPress={() => {
          if (step === 60) setStep(0);
          setRunning(!running);
        }}
      />
    </View>
  );
}
