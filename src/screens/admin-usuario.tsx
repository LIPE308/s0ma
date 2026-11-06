import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Field,
  Line,
  Notice,
  Screen,
} from "../components/ui";
import { SeletorMunicipio } from "../components/seletor-municipio";
import { EstadoConexao } from "../components/conexao";
import { mensagemErro, requisitar, useDados, useSessao } from "../servicos/api";
type Pessoa = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  regiao: string;
  administrador: boolean;
  bloqueado: boolean;
  campanhas: {
    id: string;
    titulo: string;
    estado: string;
    categoria: string;
  }[];
  atividade: { ajudas: number; doacoes: number };
};
export function CadastroAdministrativo() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const r = useRouter(),
    admin = useSessao()?.administrador;
  const q = useDados<Pessoa>(
    admin && id ? "/administracao/painel/pessoas/" + id : null,
  );
  const [nome, setNome] = useState(""),
    [email, setEmail] = useState(""),
    [telefone, setTelefone] = useState(""),
    [regiao, setRegiao] = useState(""),
    [senha, setSenha] = useState(""),
    [erro, setErro] = useState(""),
    [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false),
    [excluir, setExcluir] = useState(false);
  useEffect(() => {
    if (q.dados) {
      setNome(q.dados.nome);
      setEmail(q.dados.email);
      setTelefone(q.dados.telefone);
      setRegiao(q.dados.regiao);
    }
  }, [q.dados]);
  async function salvar() {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const p = await requisitar<{ id: number; mensagem: string }>(
        "/administracao/painel/pessoas" + (id ? "/" + id : ""),
        id ? "PUT" : "POST",
        { nome, email, telefone, regiao, ...(!id ? { senha } : {}) },
      );
      setSenha("");
      setMensagem(p.mensagem);
      if (!id)
        r.replace({ pathname: "/admin-usuario", params: { id: String(p.id) } });
      else q.atualizar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  async function apagar() {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      await requisitar("/administracao/painel/pessoas/" + id, "DELETE");
      r.replace("/admin");
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
      setExcluir(false);
    }
  }
  return (
    <Screen
      title={id ? "Cadastro e histórico" : "Cadastrar pessoa"}
      heading={q.dados?.nome}
      variant="form"
    >
      {!admin ? (
        <>
          <Notice>Acesso exclusivo do administrador.</Notice>
          <Button
            title="Abrir acesso administrativo"
            onPress={() => r.replace("/admin")}
          />
        </>
      ) : (
        <>
          {id ? <EstadoConexao {...q} /> : null}
          {!id || q.dados ? (
            <>
              {q.dados ? (
                <>
                  <Line
                    label="Cidade"
                    value={q.dados.regiao || "Não informada"}
                  />
                  <Line
                    label="Campanhas criadas"
                    value={String(q.dados.campanhas.length)}
                  />
                  <Line
                    label="Ajudas / doações registradas"
                    value={`${q.dados.atividade.ajudas} / ${q.dados.atividade.doacoes}`}
                  />
                  <Line
                    label="Acesso"
                    value={q.dados.bloqueado ? "Bloqueado" : "Ativo"}
                  />
                </>
              ) : null}
              {q.dados?.administrador ? (
                <Copy>
                  Conta administrativa: edição reservada ao operador local.
                </Copy>
              ) : (
                <>
                  <Field
                    label="Nome completo"
                    value={nome}
                    onChangeText={setNome}
                  />
                  <Field
                    label="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    email
                  />
                  <Field
                    label="Telefone"
                    value={telefone}
                    onChangeText={setTelefone}
                  />
                  <SeletorMunicipio
                    label="Cidade"
                    value={regiao}
                    onChangeText={setRegiao}
                  />
                  {!id ? (
                    <Field
                      label="Senha inicial (mínimo 12 caracteres)"
                      value={senha}
                      onChangeText={setSenha}
                      secret
                    />
                  ) : null}
                  <Button
                    title={ocupado ? "Salvando…" : "Salvar cadastro"}
                    disabled={ocupado || !nome || !email}
                    onPress={() => void salvar()}
                  />
                  {id ? (
                    <Button
                      secondary
                      title="Excluir cadastro sem histórico"
                      disabled={ocupado}
                      onPress={() => setExcluir(true)}
                    />
                  ) : null}
                </>
              )}
              {erro ? <Notice error>{erro}</Notice> : null}
              {mensagem ? <Notice>{mensagem}</Notice> : null}
              {q.dados?.campanhas.map((c) => (
                <Card
                  key={c.id}
                  title={c.titulo}
                  subtitle={c.estado + " · " + c.categoria}
                  onPress={() =>
                    r.push({ pathname: "/campanha", params: { id: c.id } })
                  }
                />
              ))}
            </>
          ) : null}
          <Dialog
            visible={excluir}
            title="Excluir este cadastro?"
            onClose={() => {
              if (!ocupado) setExcluir(false);
            }}
          >
            <Copy>
              A exclusão é permanente e só é permitida para cadastros sem
              histórico. Pessoas com campanhas ou doações devem ter o acesso
              bloqueado no painel.
            </Copy>
            <Button
              title="Confirmar exclusão"
              disabled={ocupado}
              onPress={() => void apagar()}
            />
            <Button
              secondary
              title="Cancelar"
              disabled={ocupado}
              onPress={() => setExcluir(false)}
            />
          </Dialog>
        </>
      )}
    </Screen>
  );
}
