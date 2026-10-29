import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Switch, View } from "react-native";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Field,
  Heading,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
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
  const { s, colors } = useTheme();
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
    <Screen
      variant="form"
      title="Criar conta"
      heading="Uma conta. Muitas formas."
      subtitle="Ajude e organize com o mesmo cadastro."
    >
      <Field label="Nome completo *" value={nome} onChangeText={definirNome} />
      <Field label="E-mail *" email value={email} onChangeText={definirEmail} />
      <Field
        label="Senha *"
        secret
        value={senha}
        onChangeText={definirSenha}
        placeholder="Mínimo de 6 caracteres"
      />
      <Field
        label="Confirmar senha *"
        secret
        value={confirmacao}
        onChangeText={definirConfirmacao}
      />
      <View style={s.row}>
        <Switch
          accessibilityLabel="Aceito os termos"
          value={aceito}
          onValueChange={definirAceito}
          trackColor={{ false: colors.line, true: colors.primary }}
        />
        <Copy>Aceito os termos</Copy>
      </View>
      <Button
        secondary
        title="Termos e privacidade"
        onPress={() => definirTermos(true)}
      />
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button
        title={ocupado ? "Cadastrando..." : "Criar conta"}
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
          armazenada como um resumo criptográfico. Financeiro é uma simulação;
          use dados de teste durante a apresentação.
        </Copy>
        <Button title="Entendi" onPress={() => definirTermos(false)} />
      </Dialog>
    </Screen>
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
