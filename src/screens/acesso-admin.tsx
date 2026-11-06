import { useState } from "react";
import { Button, Copy, Field, Notice, Screen } from "../components/ui";
import {
  guardarSessao,
  mensagemErro,
  requisitar,
  useSessao,
  type Usuario,
} from "../servicos/api";
import { PainelAdministrativo } from "./admin-painel";
export function AcessoAdmin() {
  const pessoa = useSessao();
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  async function entrar() {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      const s = await requisitar<{ token: string; usuario: Usuario }>(
        "/login",
        "POST",
        { email: "admin@exemplo.com", senha },
      );
      if (!s.usuario.administrador)
        throw Error("Acesso administrativo não autorizado.");
      guardarSessao(s.token, s.usuario);
      setSenha("");
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  if (pessoa?.administrador) return <PainelAdministrativo />;
  return (
    <Screen
      title="Administração"
      heading="Gestão do SOMA"
      subtitle="Acesso exclusivo do administrador."
      variant="form"
    >
      <Copy>
        Digite sua senha administrativa para acompanhar e gerenciar o
        aplicativo.
      </Copy>
      <Field
        label="Senha do administrador"
        value={senha}
        onChangeText={setSenha}
        secret
      />
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button
        title={ocupado ? "Verificando…" : "Entrar no painel"}
        disabled={ocupado || !senha}
        onPress={() => void entrar()}
      />
    </Screen>
  );
}
