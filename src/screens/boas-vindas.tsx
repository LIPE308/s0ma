import { StyleSheet, Switch, View } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { Image } from "expo-image";
import { AcessoLayout, CampoAcesso } from "../components/acesso-layout";
import { Button, Copy, Field, Notice, Screen } from "../components/ui";
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
  const q = useDados<Configuracao>("/configuracao");
  const p = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
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
    if (ocupado) return;
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
  return (
    <AcessoLayout retorno={retorno}>
      {q.dados?.google ? (
        <>
          <GoogleAcesso configurado carregando={q.carregando} />
          <Copy muted>Ou entre com seu e-mail</Copy>
        </>
      ) : null}
      {aviso ? (
        <Notice>
          {aviso === "google_vincular"
            ? "Este e-mail já tem cadastro. Entre com sua senha e use Vincular minha conta Google no perfil para manter suas campanhas e histórico."
            : aviso === "google_cancelado"
              ? "O acesso com Google foi cancelado. Você pode tentar novamente ou usar seu e-mail."
              : "Não foi possível concluir o acesso com Google. Tente novamente ou use seu e-mail."}
        </Notice>
      ) : null}
      <View style={{ gap: 18 }}>
        <CampoAcesso
          label="E-mail"
          icon="mail-outline"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          editable={!ocupado}
        />
        <CampoAcesso
          label="Senha"
          icon="lock-closed-outline"
          password
          autoComplete="current-password"
          autoCapitalize="none"
          value={senha}
          onChangeText={setSenha}
          placeholder="Sua senha"
          editable={!ocupado}
          returnKeyType="go"
          onSubmitEditing={() => {
            if (!ocupado) void entrar();
          }}
        />
        {erro ? (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Notice error>{erro}</Notice>
          </View>
        ) : null}
        <Button
          title={ocupado ? "Entrando…" : "Entrar na minha conta"}
          disabled={ocupado}
          onPress={entrar}
        />
      </View>
    </AcessoLayout>
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

const estilosFixos = StyleSheet.create({
  area7: { width: 84, height: 84, borderRadius: 42 },
  linha2: { flexDirection: "row", gap: 12, alignItems: "center" },
});
