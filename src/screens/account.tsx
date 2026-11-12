import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Switch, Text, View } from "react-native";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Heading,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { AcessoLayout, CampoAcesso } from "../components/acesso-layout";
import { Ionicons } from "@expo/vector-icons";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import {
  requisitar,
  guardarSessao,
  atualizarUsuario,
  usuarioLogado,
  useDados,
  mensagemErro,
  type Usuario,
  type Aviso,
} from "../servicos/api";
import { destinoAposLogin } from "../servicos/navegacao";

export { Entrada as Login } from "./boas-vindas";

export function SignUp() {
  const { colors } = useTheme();
  const roteador = useRouter();
  const { retorno } = useLocalSearchParams<{ retorno?: string }>();
  const [nome, definirNome] = useState("");
  const [email, definirEmail] = useState("");
  const [senha, definirSenha] = useState("");
  const [confirmacao, definirConfirmacao] = useState("");
  const [aceito, definirAceito] = useState(false);
  const [termos, definirTermos] = useState(false);
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  async function cadastrar() {
    if (ocupado) return;
    if (
      !nome.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      senha.length < 6
    ) {
      definirErro(
        "Informe seu nome, um e-mail válido e uma senha com pelo menos 6 caracteres.",
      );
      return;
    }
    if (!aceito) {
      definirErro("Leia e aceite os termos do projeto.");
      return;
    }
    if (senha !== confirmacao) {
      definirErro("As senhas precisam ser iguais.");
      return;
    }
    definirOcupado(true);
    definirErro("");
    try {
      await requisitar("/cadastro", "POST", {
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });
      const sessao = await requisitar<{ token: string; usuario: Usuario }>(
        "/login",
        "POST",
        { email: email.trim(), senha },
      );
      guardarSessao(sessao.token, sessao.usuario);
      roteador.replace({ pathname: "/completar-perfil", params: { retorno } });
    } catch (problema) {
      definirErro(mensagemErro(problema));
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <AcessoLayout cadastro retorno={retorno}>
      <View style={{ gap: 18 }}>
        <CampoAcesso
          label="Nome completo"
          icon="person-outline"
          autoComplete="name"
          autoCapitalize="words"
          value={nome}
          onChangeText={definirNome}
          placeholder="Como podemos chamar você?"
          editable={!ocupado}
        />
        <CampoAcesso
          label="E-mail"
          icon="mail-outline"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={definirEmail}
          placeholder="seu@email.com"
          editable={!ocupado}
        />
        <CampoAcesso
          label="Senha"
          icon="lock-closed-outline"
          password
          autoComplete="new-password"
          autoCapitalize="none"
          value={senha}
          onChangeText={definirSenha}
          placeholder="Pelo menos 6 caracteres"
          editable={!ocupado}
        />
        <CampoAcesso
          label="Confirmar senha"
          icon="lock-closed-outline"
          password
          autoComplete="new-password"
          autoCapitalize="none"
          value={confirmacao}
          onChangeText={definirConfirmacao}
          placeholder="Repita sua senha"
          editable={!ocupado}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!ocupado) void cadastrar();
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Aceito os termos de uso e a política de privacidade"
          accessibilityState={{ checked: aceito, disabled: ocupado }}
          disabled={ocupado}
          onPress={() => definirAceito(!aceito)}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={aceito ? "checkbox" : "square-outline"}
            size={26}
            color={aceito ? colors.primary : colors.muted}
          />
        </Pressable>
        <Text
          style={{ color: colors.muted, flex: 1, fontSize: 14, lineHeight: 23 }}
        >
          Li e aceito os termos de uso e a política de privacidade.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => definirTermos(true)}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text style={{ color: colors.primary, fontSize: 14 }}>
          Ler termos e privacidade
        </Text>
      </Pressable>
      {erro ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Notice error>{erro}</Notice>
        </View>
      ) : null}
      <Button
        title={ocupado ? "Criando sua conta…" : "Criar minha conta"}
        disabled={ocupado}
        onPress={cadastrar}
      />
      <Dialog
        visible={termos}
        title="Sobre o projeto acadêmico"
        onClose={() => definirTermos(false)}
      >
        <Copy>
          Cadastro e atividades são guardados no banco local. A senha é
          armazenada como um resumo criptográfico. Financeiro é uma apresentação;
          use dados de teste durante a apresentação.
        </Copy>
        <Button title="Entendi" onPress={() => definirTermos(false)} />
      </Dialog>
    </AcessoLayout>
  );
}

export function Access() {
  const roteador = useRouter();
  const { modo, retorno } = useLocalSearchParams<{
    modo?: string;
    retorno?: string;
  }>();
  return (
    <Screen
      title="Acesso"
      heading={
        modo === "recuperar" ? "Recuperar acesso" : "Conta criada com sucesso."
      }
    >
      <Notice>
        {modo === "recuperar"
          ? "Recuperação por e-mail não faz parte desta versão básica. Não há envio de mensagens."
          : "Seu cadastro foi salvo. Você já está conectado e pode criar campanhas e registrar ajudas."}
      </Notice>
      <Button
        title="Continuar"
        onPress={() => roteador.replace(destinoAposLogin(retorno))}
      />
    </Screen>
  );
}

export { PerfilComunidade as Profile } from "./comunidade";

export function Notifications() {
  const { s, colors } = useTheme();
  const roteadorAvisos = useRouter();
  const consulta = useDados<Aviso[]>(usuarioLogado() ? "/avisos" : null);
  const [novidades, definirNovidades] = useState(
    usuarioLogado()?.novidades || false,
  );
  const [erro, definirErro] = useState("");
  async function mudarPreferencia(valor: boolean) {
    try {
      const usuario = await requisitar<Usuario>("/perfil", "PUT", {
        novidades: valor,
      });
      atualizarUsuario(usuario);
      definirNovidades(usuario.novidades);
    } catch (problema) {
      definirErro(mensagemErro(problema));
    }
  }
  async function marcarLido(id: number) {
    try {
      await requisitar(`/avisos/${id}`, "PATCH");
      consulta.atualizar();
    } catch (problema) {
      definirErro(mensagemErro(problema));
    }
  }
  return (
    <Screen
      variant="form"
      title="Avisos e preferências"
      heading="Acompanhe o que mudou."
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          <EstadoConexao {...consulta} />
          <View style={s.row}>
            <Switch
              accessibilityLabel="Preferência de novidades"
              value={novidades}
              onValueChange={mudarPreferencia}
              trackColor={{ false: colors.line, true: colors.primary }}
            />
            <Copy>Receber novidades</Copy>
          </View>
          <Copy muted>
            Decisões sobre urgência aparecem aqui e entram na fila de e-mail. O
            envio de e-mail requer o serviço configurado pela equipe. A
            preferência de novidades é separada dos avisos sobre suas
            solicitações.
          </Copy>
          {consulta.dados?.map((aviso) => (
            <Card
              key={aviso.id}
              title={aviso.mensagem}
              subtitle={aviso.lido ? "Lido" : "Não lido"}
              icon="notifications-outline"
              onPress={() => {
                void marcarLido(aviso.id);
                if (
                  aviso.destino &&
                  /^\/urgencia\?id=[a-zA-Z0-9-]+$/.test(aviso.destino)
                )
                  roteadorAvisos.push(aviso.destino as "/urgencia");
              }}
            />
          ))}
          {consulta.dados?.length === 0 ? (
            <Notice>Nenhum aviso por enquanto.</Notice>
          ) : null}
          {erro ? <Notice error>{erro}</Notice> : null}
          <Heading>Sobre o Soma</Heading>
          <Copy>Uma campanha. Muitas formas de ajudar.</Copy>
        </>
      )}
    </Screen>
  );
}
