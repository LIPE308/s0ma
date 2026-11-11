import { Text, View } from "react-native";
import { Image } from "expo-image";
import { ImagemPrivada } from "./arquivos";
import { useTheme } from "./ui";
export function FotoPerfilAdmin({
  pessoa,
}: {
  pessoa: Record<string, unknown>;
}) {
  const { colors } = useTheme();
  const avatar =
    typeof pessoa.avatar_id === "string" ? pessoa.avatar_id : undefined;
  const google =
    typeof pessoa.foto_google === "string" ? pessoa.foto_google : undefined;
  const iniciais = String(pessoa.nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <View
      accessibilityLabel={
        "Foto de perfil de " + String(pessoa.nome || "usuário")
      }
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          position: "absolute",
          color: colors.primary,
          fontSize: 18,
          fontWeight: "600",
        }}
      >
        {iniciais}
      </Text>
      {avatar ? (
        <ImagemPrivada id={avatar} altura={52} circular />
      ) : google ? (
        <Image
          source={{ uri: google }}
          style={{ width: 52, height: 52, borderRadius: 26 }}
          contentFit="cover"
        />
      ) : null}
    </View>
  );
}
