import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Progress } from "./ui";
export function TutorialIlustracao({ etapa }: { etapa: number }) {
  const { colors, fontsReady } = useTheme();
  const texto = {
    color: colors.ink,
    fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
  };
  function linha(
    nome: string,
    icone: keyof typeof Ionicons.glyphMap,
    destaque = false,
  ) {
    return (
      <View
        key={nome}
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: destaque ? colors.primary : colors.line,
          backgroundColor: destaque ? colors.brandSoft : colors.surface,
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Ionicons name={icone} size={20} color={colors.primary} />
        <Text style={[texto, { fontSize: 13, flex: 1 }]}>{nome}</Text>
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={
        [
          "Ilustração da tela de causas com campanha urgente em destaque",
          "Ilustração das formas de ajudar: dinheiro, tempo e compartilhamento",
          "Ilustração do formulário de criação de campanha",
          "Ilustração do caminho da receita publicitária até as campanhas urgentes",
          "Ilustração do acompanhamento de campanhas, cidades e atualizações",
        ][etapa]
      }
      style={{
        alignItems: "center",
        backgroundColor: colors.brandSoft,
        borderRadius: 26,
        padding: 18,
      }}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          width: "100%",
          maxWidth: 285,
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: 26,
          padding: 16,
          backgroundColor: colors.surface,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[texto, { fontSize: 17, color: colors.primary }]}>
            SOMA
          </Text>
          <Ionicons name="heart-outline" size={21} color={colors.primary} />
        </View>
        <Text style={[texto, { fontSize: 14 }]}>
          {
            [
              "Causas que precisam de você",
              "Como você quer ajudar?",
              "Conte sua história",
              "Apoio por anúncios",
              "Seu impacto",
            ][etapa]
          }
        </Text>
        {etapa === 0 ? (
          <>
            <View
              style={{
                backgroundColor: colors.brandSoft,
                borderRadius: 16,
                padding: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: colors.errorBg,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.error }}>
                  ♥ Urgente
                </Text>
              </View>
              <Ionicons name="home-outline" size={48} color={colors.primary} />
              <Text style={texto}>Uma família precisa recomeçar</Text>
              <Progress done={45} total={100} />
            </View>
            {linha("Conhecer a campanha", "chevron-forward", true)}
          </>
        ) : null}
        {etapa === 1 ? (
          <>
            {linha("Fazer uma doação", "heart-outline", true)}
            {linha("Oferecer meu tempo", "people-outline")}
            {linha("Compartilhar a causa", "share-social-outline")}
          </>
        ) : null}
        {etapa === 2 ? (
          <>
            {linha("Título e história", "create-outline", true)}
            {linha("Fotos e necessidades", "images-outline")}
            {linha("Meta e cidade", "location-outline")}
            <View
              style={{
                borderRadius: 12,
                padding: 12,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: colors.onPrimary,
                  fontSize: 13,
                }}
              >
                Revisar e publicar
              </Text>
            </View>
          </>
        ) : null}
        {etapa === 3 ? (
          <>
            {linha("Receita dos anunciantes", "megaphone-outline", true)}
            <Ionicons
              name="arrow-down"
              color={colors.primary}
              size={19}
              style={{ alignSelf: "center" }}
            />
            {linha("Fundo solidário", "wallet-outline")}
            <Ionicons
              name="arrow-down"
              color={colors.primary}
              size={19}
              style={{ alignSelf: "center" }}
            />
            {linha("Causas urgentes elegíveis", "heart-outline", true)}
          </>
        ) : null}
        {etapa === 4 ? (
          <>
            {linha("Mapa por cidades", "map-outline", true)}
            {linha("Campanhas e atualizações", "notifications-outline")}
            <View
              style={{
                backgroundColor: colors.gentle,
                padding: 14,
                borderRadius: 14,
                gap: 8,
              }}
            >
              <Ionicons name="trending-up" color={colors.gentleInk} size={27} />
              <Text style={[texto, { color: colors.gentleInk, fontSize: 13 }]}>
                Acompanhe o destino do apoio
              </Text>
              <Progress done={65} total={100} />
            </View>
          </>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 12,
          }}
        >
          {(
            [
              "home-outline",
              "search-outline",
              "add-circle-outline",
              "heart-outline",
              "person-outline",
            ] as const
          ).map((icone, i) => (
            <Ionicons
              key={icone}
              name={icone}
              color={
                i === [1, 1, 2, 3, 3][etapa] ? colors.primary : colors.muted
              }
              size={19}
            />
          ))}
        </View>
      </View>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 10 }}>
        Prévia das funcionalidades
      </Text>
    </View>
  );
}
