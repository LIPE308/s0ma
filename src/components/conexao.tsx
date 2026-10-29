import { StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { Button, Copy, Notice, useTheme } from "./ui";
import { useReducedMotion } from "../design/motion";

export function EstadoConexao({
  erro,
  carregando,
  atualizar,
}: {
  erro: string;
  carregando: boolean;
  atualizar?: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return erro ? (
    <>
      <Notice error>{erro}</Notice>
      {atualizar ? (
        <Button secondary title="Tentar novamente" onPress={atualizar} />
      ) : null}
    </>
  ) : carregando ? (
    <View accessibilityLiveRegion="polite" style={estilosFixos.linha1}>
      {!reduced ? <ActivityIndicator color={colors.primary} /> : null}
      <Copy muted>Carregando...</Copy>
    </View>
  ) : null;
}
export function PedirLogin() {
  const roteador = useRouter();
  const caminho = usePathname();
  const parametros = useLocalSearchParams<Record<string, string | string[]>>();
  const busca = Object.entries(parametros)
    .flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value]).map(
        (item) => encodeURIComponent(key) + "=" + encodeURIComponent(item),
      ),
    )
    .join("&");
  const retorno = caminho + (busca ? "?" + busca : "");
  return (
    <>
      <Notice>
        Entre na sua conta para registrar sua participação. Você volta para esta
        etapa depois do acesso.
      </Notice>
      <Button
        title="Entrar"
        onPress={() =>
          roteador.push({ pathname: "/entrar", params: { retorno } })
        }
      />
    </>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  linha1: { flexDirection: "row", alignItems: "center", gap: 10 },
});
