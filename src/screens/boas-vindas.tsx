import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandSignature } from "../design/brand";
import {
  Button,
  Copy,
  Field,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { GoogleAcesso } from "../components/google-acesso";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import { EnviarArquivo, ImagemPrivada } from "../components/arquivos";
import {
  requisitar,
  guardarSessao,
  atualizarUsuario,
  usuarioLogado,
  useDados,
  mensagemErro,
  useSessao,
  type Usuario,
} from "../servicos/api";
import { destinoDaSessao } from "../servicos/acesso";
import { destinoAposLogin } from "../servicos/navegacao";
import type { Configuracao, PerfilAmpliado } from "../servicos/soma2";
export function Entrada() {
  const r = useRouter();
  const { retorno, aviso } = useLocalSearchParams<{
    retorno?: string;
    aviso?: string;
  }>();
  const { colors, fontsReady } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const q = useDados<Configuracao>("/configuracao");
  const p = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [emailAberto, setEmailAberto] = useState(false);
  if (p && !ocupado && aviso === "google_vincular")
    return <Redirect href="/personalizar-perfil?aviso=google_vincular" />;
  if (p && !ocupado)
    return (
      <Redirect
        href={
          p.perfil_completo === false
            ? "/completar-perfil"
            : destinoAposLogin(retorno)
        }
      />
    );
  async function entrar() {
    if (!email.trim() || !senha) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const s = await requisitar<{ token: string; usuario: Usuario }>(
        "/login",
        "POST",
        { email: email.trim(), senha },
      );
      guardarSessao(s.token, s.usuario);
      r.replace(await destinoDaSessao(retorno));
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  const largo = width >= 900;
  const mostrarEmail = emailAberto || (!q.carregando && !q.dados?.google);
  const alturaFoto = mostrarEmail
    ? Math.max(width < 360 ? 300 : 250, Math.min(330, height * 0.32))
    : Math.max(330, Math.min(510, height * 0.57));
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilosFixos.area1}
      >
        <View
          style={{
            flex: 1,
            flexDirection: largo ? "row" : "column",
            minHeight: height,
          }}
        >
          <View
            style={{
              width: largo ? "52%" : "100%",
              height: largo ? undefined : alturaFoto,
              minHeight: largo ? height : undefined,
              overflow: "hidden",
              backgroundColor: "#153A99",
            }}
          >
            <Image
              source={require("../../assets/photos/familia-pexels-catalina.jpg")}
              accessibilityLabel="Família reunida em um abraço; fotografia ilustrativa"
              contentFit="cover"
              contentPosition={largo ? "center" : "top"}
              style={estilosFixos.area2}
            />
            <View style={estilosFixos.area3} />
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                padding: largo ? 48 : 24,
                paddingBottom: largo ? 56 : mostrarEmail ? 44 : 58,
                backgroundColor: "rgba(9,25,54,0.1)",
              }}
            >
              <BrandSignature inverse size={52} />
              <Text
                style={{
                  fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
                  fontSize: largo ? 36 : 26,
                  lineHeight: largo ? 47 : 35,
                  color: "#FFFFFF",
                  maxWidth: 420,
                  marginTop: 14,
                }}
              >
                Juntos por um mundo mais solidário.
              </Text>
              <Text style={estilosFixos.texto1}>
                Fotografia ilustrativa · Catalina Herrera / Pexels
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderTopLeftRadius: largo ? 0 : 30,
              borderTopRightRadius: largo ? 0 : 30,
              marginTop: largo ? 0 : -30,
              padding: width < 360 ? 20 : largo ? 48 : 24,
              paddingBottom: Math.max(28, insets.bottom + 16),
            }}
          >
            <View style={estilosFixos.grupo1}>
              <View style={estilosFixos.grupo2}>
                <Text
                  accessibilityRole="header"
                  style={{
                    fontSize: 24,
                    lineHeight: 33,
                    color: colors.ink,
                    fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
                  }}
                >
                  Bom ter você aqui.
                </Text>
                <Text
                  style={{ fontSize: 15, lineHeight: 24, color: colors.muted }}
                >
                  Encontre uma causa. Faça parte de uma história.
                </Text>
              </View>
              <GoogleAcesso
                configurado={q.dados?.google ?? false}
                carregando={q.carregando}
              />
              {aviso ? (
                <Notice>
                  {aviso === "google_vincular"
                    ? "Este e-mail já tem cadastro. Entre com sua senha e use Vincular minha conta Google no perfil para manter suas campanhas e histórico."
                    : aviso === "google_cancelado"
                      ? "O acesso com Google foi cancelado. Você pode tentar novamente ou usar seu e-mail."
                      : "Não foi possível concluir o acesso com Google. Tente novamente ou use seu e-mail."}
                </Notice>
              ) : null}
              {mostrarEmail ? (
                <View style={estilosFixos.grupo3}>
                  <Field
                    label="E-mail"
                    email
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                  />
                  <Field
                    label="Senha"
                    secret
                    value={senha}
                    onChangeText={setSenha}
                    placeholder="Sua senha"
                  />
                  {erro ? <Notice error>{erro}</Notice> : null}
                  <Button
                    title={ocupado ? "Entrando…" : "Entrar"}
                    disabled={ocupado}
                    onPress={entrar}
                  />
                </View>
              ) : (
                <Button
                  secondary
                  title="Entrar com e-mail"
                  onPress={() => setEmailAberto(true)}
                />
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  r.push({ pathname: "/criar-conta", params: { retorno } })
                }
                style={estilosFixos.area4}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.primary,
                    fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
                  }}
                >
                  Primeira vez por aqui? Crie sua conta
                </Text>
              </Pressable>
              <View style={estilosFixos.linha1}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => r.push("/termos")}
                  style={estilosFixos.area5}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Termos de Uso
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => r.push("/privacidade")}
                  style={estilosFixos.area6}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Política de Privacidade
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function CompletarPerfil() {
  const r = useRouter();
  const { retorno } = useLocalSearchParams<{ retorno?: string }>();
  const q = useDados<PerfilAmpliado>(
    usuarioLogado() ? "/perfil-ampliado" : null,
  );
  const p = q.dados;
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [foto, setFoto] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    if (p) {
      setNome(p.nome);
      setCidade(p.regiao || "");
      setAvatar(p.avatar_id);
      setFoto(Boolean(p.usar_foto_google));
    }
  }, [p]);
  async function salvar() {
    setOcupado(true);
    setErro("");
    try {
      const u = await requisitar<Usuario>("/perfil/completar", "PUT", {
        nome,
        regiao: cidade,
        usar_foto_google: foto,
        avatar_id: avatar,
      });
      atualizarUsuario({ ...u, perfil_completo: true });
      r.replace(destinoAposLogin(retorno));
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Screen
      variant="form"
      title="Seu primeiro passo"
      heading="Como podemos chamar você?"
      subtitle="Só o essencial para começar. Você pode completar o resto depois."
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          <EstadoConexao {...q} />
          {p ? (
            <>
              <ImagemPrivada id={avatar} altura={120} />
              {!avatar && p.foto_google && foto ? (
                <Image
                  source={{ uri: p.foto_google }}
                  style={estilosFixos.area7}
                  accessibilityLabel="Foto autorizada da sua conta Google"
                />
              ) : null}
              <Field label="Seu nome" value={nome} onChangeText={setNome} />
              <Field
                label="Cidade (opcional)"
                value={cidade}
                onChangeText={setCidade}
                placeholder="Apenas a cidade, sem endereço"
              />
              {p.foto_google ? (
                <View style={estilosFixos.linha2}>
                  <Switch
                    accessibilityLabel="Usar minha foto do Google"
                    value={foto}
                    onValueChange={setFoto}
                  />
                  <Copy>Usar minha foto do Google</Copy>
                </View>
              ) : null}
              <EnviarArquivo
                finalidade="avatar"
                aoEnviar={(a) => setAvatar(a.id)}
              />
              <Copy muted>
                Seu e-mail e contato ficam privados. Nenhuma informação será
                publicada sem sua escolha.
              </Copy>
              {erro ? <Notice error>{erro}</Notice> : null}
              <Button
                title={ocupado ? "Salvando…" : "Começar a somar"}
                disabled={ocupado || !nome.trim()}
                onPress={salvar}
              />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  area1: { flexGrow: 1 },
  area2: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  area3: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(9,25,54,0.4)",
  },
  texto1: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    backgroundColor: "rgba(9,25,54,.72)",
    alignSelf: "flex-start",
    padding: 6,
    borderRadius: 6,
  },
  grupo1: { width: "100%", maxWidth: 420, alignSelf: "center", gap: 20 },
  grupo2: { gap: 8 },
  grupo3: { gap: 16 },
  area4: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  linha1: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  area5: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  area6: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  area7: { width: 84, height: 84, borderRadius: 42 },
  linha2: { flexDirection: "row", gap: 12, alignItems: "center" },
});
