import { StyleSheet, Platform, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { MotionPressable } from "../design/motion";
import { useDados, urlApi } from "../servicos/api";
import type { Configuracao } from "../servicos/soma2";
import { googleIcon } from "../data/google-icon";
import { useTheme } from "./ui";
export function GoogleAcesso({
  configurado,
  carregando = false,
}: {
  configurado?: boolean;
  carregando?: boolean;
}) {
  const { colors } = useTheme();
  const q = useDados<Configuracao>(
    configurado === undefined ? "/configuracao" : null,
  );
  const disponivel =
    Platform.OS === "web" && (configurado ?? q.dados?.google) === true;
  return (
    <View style={estilosFixos.grupo1}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Continuar com Google"
        accessibilityState={{ disabled: !disponivel || carregando }}
        disabled={!disponivel || carregando}
        onPress={() => {
          if (Platform.OS === "web")
            window.location.assign(urlApi() + "/auth/google/iniciar");
        }}
        style={({ pressed }) => ({
          minHeight: 54,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "#747775",
          backgroundColor: "#FFFFFF",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          opacity: pressed ? 0.8 : disponivel ? 1 : 0.6,
        })}
      >
        <SvgXml xml={googleIcon} width={28} height={28} />
        <Text
          style={{
            color: "#1F1F1F",
            fontFamily: Platform.OS === "web" ? "Arial" : undefined,
            fontSize: 16,
            fontWeight: "500",
            flex: 1,
            textAlign: "center",
          }}
        >
          Continuar com Google
        </Text>
        <View style={estilosFixos.area1} />
      </MotionPressable>
      {!disponivel && !carregando ? (
        <Text style={{ fontSize: 13, lineHeight: 20, color: colors.muted }}>
          O Google ainda não está disponível. Você pode entrar com seu e-mail.
        </Text>
      ) : null}
    </View>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  grupo1: { gap: 10 },
  area1: { width: 20 },
});
