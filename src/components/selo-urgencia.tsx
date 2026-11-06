import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Campanha } from "../servicos/api";
import { prioridadeCampanha } from "../servicos/campanhas-exemplos";
export function SeloUrgencia({ campanha }: { campanha: Campanha }) {
  if (campanha.estado !== "ativa" || prioridadeCampanha(campanha) < 2)
    return null;
  return (
    <View
      accessibilityLabel="Campanha urgente, situação crítica"
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 9,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#B91C1C",
      }}
    >
      <Ionicons
        name="alert-circle"
        size={16}
        color="#FFFFFF"
        accessible={false}
      />
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.6,
        }}
      >
        URGENTE
      </Text>
    </View>
  );
}
