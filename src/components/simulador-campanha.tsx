import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Animated, AppState, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ui";
import { nativeDriver, useReducedMotion } from "../design/motion";
import { projetarCampanha } from "../servicos/projecao-campanha";
import { formatarDinheiro } from "../data/formatacao";

// Cenário didático isolado: nunca grava pagamentos, rendimentos ou saldo no banco.
export function SimuladorCampanha({
  campanhaId,
  confirmado = 0,
  meta = 0,
  somenteAnuncios = false,
  apoioAnuncios = false,
}: {
  automatico?: boolean;
  campanhaId: string;
  confirmado?: number;
  meta?: number;
  somenteAnuncios?: boolean;
  apoioAnuncios?: boolean;
}) {
  const { colors, fontsReady } = useTheme();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(AppState.currentState === "active");
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  const concluida = step >= 60;
  useEffect(() => {
    if (!focused || !active || concluida) return;
    const timer = setInterval(() => setStep((s) => Math.min(60, s + 1)), 8000);
    return () => clearInterval(timer);
  }, [focused, active, concluida]);
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
  const { base, doacoes, anuncios, rendimento, total, percentual, restante } =
    projetarCampanha(campanhaId, confirmado, meta, step, apoioAnuncios);
  return (
    <View
      testID="campaign-money-demo"
      style={{
        backgroundColor: colors.successBg,
        borderRadius: 24,
        padding: 24,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="trending-up" color={colors.success} size={26} />
        <Text
          style={{
            color: colors.success,
            fontSize: 16,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
          }}
        >
          {somenteAnuncios
            ? "Os anúncios também ajudam"
            : "Sua campanha em crescimento"}
        </Text>
      </View>
      <Text style={{ color: colors.success, fontSize: 13 }}>
        {somenteAnuncios ? "Receita de anúncios projetada" : "Saldo projetado"}
      </Text>
      <Animated.Text
        testID="demo-money-total"
        style={{
          color: colors.success,
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
        {formatarDinheiro((somenteAnuncios ? anuncios : total) / 100)}
      </Animated.Text>
      {somenteAnuncios ? (
        <Text style={{ color: colors.success, fontSize: 14, lineHeight: 22 }}>
          Acompanhe a evolução estimada do apoio dos anúncios para esta
          campanha.
        </Text>
      ) : (
        <>
          {meta > 0 ? (
            <View style={{ gap: 10 }}>
              <Text
                testID="campaign-projected-goal"
                style={{ color: colors.success, fontSize: 15 }}
              >
                Meta: {formatarDinheiro(meta / 100)} · {percentual.toFixed(2)}%
              </Text>
              <View
                style={{
                  height: 10,
                  borderRadius: 8,
                  backgroundColor: colors.line,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${percentual}%`,
                    height: "100%",
                    backgroundColor: colors.success,
                    borderRadius: 8,
                  }}
                />
              </View>
              <Text style={{ color: colors.success, fontSize: 13 }}>
                {restante > 0
                  ? `Faltam ${formatarDinheiro(restante / 100)} para a meta projetada`
                  : "Meta projetada alcançada"}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.success }}>
              Adicione uma meta financeira para acompanhar seu progresso.
            </Text>
          )}
          <Text style={{ color: colors.success, fontSize: 13 }}>
            A partir do saldo registrado: {formatarDinheiro(base / 100)}
          </Text>
          {[
            ["Doações previstas", doacoes],
            ...(apoioAnuncios
              ? [["Receita de anúncios prevista", anuncios]]
              : []),
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
              <Text style={{ color: colors.success, flex: 1, fontSize: 13 }}>
                {label}
              </Text>
              <Text style={{ color: colors.success, fontSize: 14 }}>
                + {formatarDinheiro(Number(value) / 100)}
              </Text>
            </View>
          ))}
        </>
      )}
      <Text style={{ color: colors.success, fontSize: 12, lineHeight: 19 }}>
        Estimativa de evolução, separada do saldo registrado.
      </Text>
    </View>
  );
}
