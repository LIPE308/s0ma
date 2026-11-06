import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Campanha } from "../servicos/api";
import { prioridadeCampanha } from "../servicos/campanhas-exemplos";
import { useTheme } from "./ui";

export function SeloUrgencia({
  campanha,
  variante = "selo",
}: {
  campanha: Campanha;
  variante?: "selo" | "foto" | "detalhe";
}) {
  const { colors, fontsReady } = useTheme();
  if (campanha.estado !== "ativa" || prioridadeCampanha(campanha) < 2)
    return null;
  const foto = variante === "foto";
  const detalhe = variante === "detalhe";
  const vermelho = foto ? "#A72D34" : colors.error;
  return (
    <View
      accessibilityLabel="Campanha urgente, situação crítica"
      style={{
        alignSelf: detalhe ? "stretch" : "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: detalhe ? 12 : 7,
        borderRadius: detalhe ? 18 : 99,
        paddingHorizontal: detalhe ? 14 : 11,
        paddingVertical: detalhe ? 13 : 7,
        borderWidth: detalhe || foto ? 1 : 0,
        borderColor: foto ? "rgba(255,255,255,0.85)" : colors.line,
        backgroundColor: foto
          ? "rgba(255,255,255,0.97)"
          : detalhe
            ? colors.brandSoft
            : colors.errorBg,
      }}
    >
      <View
        style={{
          width: detalhe ? 34 : 20,
          height: detalhe ? 34 : 20,
          borderRadius: 99,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: foto
            ? "#FFF0F1"
            : detalhe
              ? colors.surface
              : "transparent",
        }}
      >
        <Ionicons
          name="heart"
          size={detalhe ? 18 : 13}
          color={vermelho}
          accessible={false}
        />
      </View>
      <View style={{ gap: 3, flex: detalhe ? 1 : undefined }}>
        <Text
          style={{
            color: vermelho,
            fontSize: 12,
            lineHeight: 17,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
            fontWeight: fontsReady ? undefined : "600",
          }}
        >
          Urgente
        </Text>
        {detalhe ? (
          <Text
            style={{
              color: colors.ink,
              fontSize: 14,
              lineHeight: 21,
              fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
            }}
          >
            Uma ajuda que não pode esperar.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
