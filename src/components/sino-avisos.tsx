import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { AppState, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDados, useSessao } from "../servicos/api";
import { useTheme } from "./ui";

export function SinoAvisos() {
  const usuario = useSessao();
  const router = useRouter();
  const { colors } = useTheme();
  const foco = useIsFocused();
  const consulta = useDados<{ nao_lidos: number }>(
    usuario ? "/avisos/resumo" : null,
  );
  const atualizar = useRef(consulta.atualizar);
  atualizar.current = consulta.atualizar;
  useEffect(() => {
    if (!usuario || !foco) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") atualizar.current();
    }, 30000);
    return () => clearInterval(timer);
  }, [usuario, foco]);
  if (!usuario) return null;
  const total = Number(consulta.dados?.nao_lidos || 0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Avisos" + (total ? ", " + total + " não lidos" : "")}
      onPress={() => router.push("/avisos")}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
        backgroundColor: colors.soft,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Ionicons
        aria-hidden
        accessible={false}
        name="notifications-outline"
        size={23}
        color={colors.ink}
      />
      {total > 0 ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            minWidth: 18,
            minHeight: 18,
            paddingHorizontal: 4,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{ fontSize: 11, lineHeight: 16, color: colors.onPrimary }}
          >
            {total > 99 ? "99+" : total}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
