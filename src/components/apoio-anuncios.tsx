import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "./ui";
export function ApoioAnuncios({ compacto = false }: { compacto?: boolean }) {
  const { colors, fontsReady } = useTheme();
  const r = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Como os anúncios ajudam as campanhas urgentes"
      onPress={() =>
        r.push({ pathname: "/tutorial", params: { etapa: "anuncios" } })
      }
      style={({ pressed }) => ({
        backgroundColor: colors.brandSoft,
        borderRadius: 22,
        padding: compacto ? 16 : 20,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="megaphone-outline"
            size={23}
            color={colors.primary}
            accessible={false}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.primary,
              fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
            }}
          >
            O diferencial do SOMA
          </Text>
          <Text
            style={{
              fontSize: compacto ? 16 : 19,
              lineHeight: compacto ? 23 : 27,
              color: colors.ink,
              fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
            }}
          >
            Anúncios também podem virar ajuda.
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, lineHeight: 22, color: colors.muted }}>
        Nossa proposta é transformar parte da receita publicitária em apoio às
        causas urgentes. Compartilhar o app amplia essa rede.
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 14,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
          }}
        >
          Entenda como funciona
        </Text>
        <Ionicons
          name="arrow-forward"
          size={19}
          color={colors.primary}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
