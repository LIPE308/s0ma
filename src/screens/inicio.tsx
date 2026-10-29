import type { Colors } from "../design/theme";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Heading,
  Copy,
  Button,
  Disclosure,
  EmptyState,
  useTheme,
} from "../components/ui";
import { CartaoCampanha } from "../components/campanhas";
import { EstadoConexao } from "../components/conexao";
import { SinoAvisos } from "../components/sino-avisos";
import { MotionPressable } from "../design/motion";
import { useDados, useSessao, type Campanha } from "../servicos/api";
export function Inicio() {
  const router = useRouter();
  const pessoa = useSessao();
  const { colors, fontsReady } = useTheme();
  const { width } = useWindowDimensions();
  const campanhas = useDados<Campanha[]>("/campanhas");
  const estilos = criarEstilos(colors, fontsReady, width);
  const ativas =
    campanhas.dados?.filter((campanha) => campanha.estado === "ativa") || [];
  const revisadas = ativas.filter((campanha) => campanha.urgencia?.revisada);
  const destaques = (revisadas.length ? revisadas : ativas).slice(0, 2);
  const acoes = [
    {
      nome: "Doar",
      icone: "heart-outline" as const,
      acao: () =>
        router.push("/explorar"),
    },
    {
      nome: "Criar campanha",
      icone: "add-outline" as const,
      acao: () => router.push("/criar"),
    },
    {
      nome: "Convidar amigos",
      icone: "people-outline" as const,
      acao: () => router.push("/convidar"),
    },
  ];
  return (
    <Screen
      title="soma"
      back={false}
      action={
        <View style={estilos.acoesCabecalho}>
          <SinoAvisos />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir meu perfil"
            onPress={() => router.push("/perfil")}
            style={estilos.avatar}
          >
            <Text style={estilos.inicial}>
              {pessoa?.nome.trim()[0]?.toUpperCase() || "S"}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={estilos.saudacao}>
        <Text accessibilityRole="header" style={estilos.tituloSaudacao}>
          Olá, {pessoa?.nome.trim().split(/\s+/)[0] || "você"}!
        </Text>
        <Copy muted>Juntos, podemos transformar vidas.</Copy>
      </View>
      <View style={estilos.destaque}>
        <Image
          source={require("../../assets/photos/familia-pexels-catalina.jpg")}
          accessibilityLabel="Família em um abraço; imagem ilustrativa da comunidade"
          contentFit="cover"
          contentPosition={{ left: "50%", top: "38%" }}
          style={estilos.foto}
        />
        <View style={estilos.sombraFoto} />
        <View style={estilos.conteudoDestaque}>
          <Text style={estilos.tituloDestaque}>
            Pequenos gestos, novos começos.
          </Text>
          <Text style={estilos.textoDestaque}>
            Aproxime sua vontade de ajudar de quem precisa.
          </Text>
          <View style={estilos.botaoDestaque}>
            <Button
              inverse
              title="Quero ajudar"
              onPress={() => router.push("/explorar")}
            />
          </View>
          <Text style={estilos.creditoFoto}>Fotografia ilustrativa</Text>
        </View>
      </View>
      <View style={estilos.atalhos}>
        {acoes.map((acao) => (
          <MotionPressable
            key={acao.nome}
            containerStyle={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel={acao.nome}
            onPress={acao.acao}
            style={({ pressed }) => ({
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={estilos.iconeAtalho}>
              <Ionicons
                aria-hidden
                accessible={false}
                name={acao.icone}
                color={colors.primary}
                size={26}
              />
            </View>
            <Text style={estilos.nomeAtalho}>{acao.nome}</Text>
          </MotionPressable>
        ))}
      </View>
      <View style={estilos.cabecalhoCampanhas}>
        <View style={estilos.tituloCampanhas}>
          <Heading>
            {revisadas.length
              ? "Causas com prioridade revisada"
              : "Campanhas da comunidade"}
          </Heading>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver todas as campanhas"
          onPress={() => router.push("/explorar")}
          style={estilos.verTodas}
        >
          <Text style={estilos.textoVerTodas}>Ver todas</Text>
        </Pressable>
      </View>
      <EstadoConexao {...campanhas} />
      <View style={estilos.campanhas}>
        {destaques.map((campanha) => (
          <View key={campanha.id} style={estilos.colunaCampanha}>
            <CartaoCampanha
              campanha={campanha}
              aoAbrir={() =>
                router.push({
                  pathname: "/campanha",
                  params: { id: campanha.id },
                })
              }
            />
          </View>
        ))}
      </View>
      {campanhas.dados && !ativas.length ? (
        <EmptyState
          title="Uma nova história pode começar."
          action="Criar campanha"
          onPress={() => router.push("/criar")}
        >
          Ainda não há campanhas recebendo ajuda.
        </EmptyState>
      ) : null}
      <Disclosure title="Outras formas de somar">
        <Button
          secondary
          title="Mapa Solidário"
          onPress={() => router.push("/mapa")}
        />
        <Button
          secondary
          title="Ser voluntário"
          onPress={() =>
            router.push({
              pathname: "/explorar",
              params: { secao: "Voluntariado", tipo: "Tempo" },
            })
          }
        />
        <Button
          secondary
          title="Doar objetos"
          onPress={() =>
            router.push({
              pathname: "/explorar",
              params: { secao: "Necessidades", tipo: "Objetos" },
            })
          }
        />
        <Button
          secondary
          title="Eventos da comunidade"
          onPress={() =>
            router.push({ pathname: "/explorar", params: { secao: "Eventos" } })
          }
        />
        <Button
          secondary
          title="Como os anúncios ajudam"
          onPress={() => router.push("/transparencia-anuncios")}
        />
      </Disclosure>
    </Screen>
  );
}

// Aula de 07/05: componentes no JSX e estilos nomeados no StyleSheet.
function criarEstilos(colors: Colors, fontsReady: boolean, width: number) {
  return StyleSheet.create({
    acoesCabecalho: { flexDirection: "row", gap: 8 },
    avatar: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: colors.brandSoft,
    },
    inicial: {
      fontSize: 17,
      color: colors.primary,
      fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
    },
    saudacao: { gap: 6 },
    tituloSaudacao: {
      fontSize: 25,
      lineHeight: 34,
      fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
      color: colors.ink,
    },
    destaque: {
      minHeight: 260,
      borderRadius: 26,
      overflow: "hidden",
      backgroundColor: colors.hero,
    },
    foto: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    },
    sombraFoto: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(10,30,65,.62)",
    },
    conteudoDestaque: {
      padding: 24,
      minHeight: 260,
      justifyContent: "flex-end",
      gap: 12,
    },
    tituloDestaque: {
      fontSize: 25,
      lineHeight: 33,
      fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
      color: "#FFFFFF",
      maxWidth: 300,
    },
    textoDestaque: {
      fontSize: 14,
      lineHeight: 22,
      color: "#FFFFFF",
      maxWidth: 310,
    },
    botaoDestaque: { alignSelf: "flex-start" },
    creditoFoto: {
      color: "#FFFFFF",
      fontSize: 10,
      backgroundColor: "rgba(9,25,54,.72)",
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 6,
    },
    atalhos: { flexDirection: "row", gap: 8 },
    iconeAtalho: {
      width: 54,
      height: 54,
      borderRadius: 20,
      backgroundColor: colors.brandSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    nomeAtalho: {
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
      color: colors.ink,
    },
    cabecalhoCampanhas: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    tituloCampanhas: { flex: 1 },
    verTodas: { minHeight: 44, justifyContent: "center" },
    textoVerTodas: { color: colors.primary, fontSize: 13 },
    campanhas: { flexDirection: width >= 760 ? "row" : "column", gap: 18 },
    colunaCampanha: { flex: 1, minWidth: 0 },
  });
}
