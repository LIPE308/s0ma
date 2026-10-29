import {
  StyleSheet,
  Linking,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Card,
  Choices,
  Copy,
  Dialog,
  Disclosure,
  EmptyState,
  Field,
  Heading,
  Line,
  Notice,
  Progress,
  Screen,
  Tag,
  useTheme,
} from "../components/ui";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import {
  criarChaveOperacao,
  mensagemErro,
  requisitar,
  useDados,
  useSessao,
} from "../servicos/api";
import { converterValor, formatarDinheiro } from "../data/formatacao";

type Registro = Record<string, unknown> & { id: string | number };
type Lista = {
  itens: Registro[];
  total: number;
  pagina: number;
  paginas: number;
};
type Resumo = {
  atualizado_em: string;
  campanhas: { estado: string; total: number }[];
  pessoas: { total: number; bloqueados: number };
  urgencias_pendentes: number;
  financeiro: {
    bruto: number;
    custos: number;
    liquido: number;
    fundo: number;
    operacao: number;
    distribuido: number;
    retido: number;
    modo: string;
  };
  operacoes: { denuncias: number; repasses: number };
  emails: { estado: string; total: number }[];
  fila_urgencias: Registro[];
  fila_campanhas: Registro[];
};
type Integracoes = {
  banco: {
    conectado: boolean;
    nome: string;
    host: string;
    porta: number;
    usuario: string;
    versao: string;
  };
  google: { configurado: boolean; retorno: string };
  email: {
    configurado: boolean;
    remetente: string;
    host: string;
    porta: number;
  };
  publicidade: { configurado: boolean; provedor: string; conta: string };
  notificacoes: { aplicativo: boolean; push: boolean };
};
type Acao = {
  tipo: "bloquear" | "conciliar" | "distribuir" | "denuncia" | "repetirEmail";
  item: Registro;
};
const secoes = [
  { nome: "Visão geral", icone: "grid-outline", tipo: "" },
  { nome: "Campanhas", icone: "heart-outline", tipo: "campanhas" },
  { nome: "Urgências", icone: "alert-circle-outline", tipo: "urgencias" },
  { nome: "Receita e fundo", icone: "wallet-outline", tipo: "receitas" },
  { nome: "Distribuições", icone: "git-branch-outline", tipo: "distribuicoes" },
  {
    nome: "Relatórios de anúncios",
    icone: "bar-chart-outline",
    tipo: "relatorios",
  },
  { nome: "Pessoas", icone: "people-outline", tipo: "usuarios" },
  { nome: "Denúncias", icone: "flag-outline", tipo: "denuncias" },
  { nome: "Repasses", icone: "swap-horizontal-outline", tipo: "repasses" },
  { nome: "Doações", icone: "gift-outline", tipo: "pagamentos" },
  { nome: "E-mails", icone: "mail-outline", tipo: "emails" },
  { nome: "Integrações", icone: "link-outline", tipo: "" },
  { nome: "Auditoria", icone: "list-outline", tipo: "auditoria" },
] as const;
const valor = (r: Registro, k: string) => String(r[k] ?? "");
const dinheiro = (n: unknown) => formatarDinheiro(Number(n || 0) / 100);
const quando = (s: unknown) =>
  s ? new Date(String(s)).toLocaleString("pt-BR") : "Ainda não enviado";
const estados: Record<string, string[]> = {
  campanhas: ["rascunho", "ativa", "ajustes", "suspensa", "encerrada"],
  urgencias: ["pendente", "recurso", "revisada"],
  receitas: ["pendente", "confirmada", "distribuida"],
  emails: ["pendente", "enviando", "enviado", "falhou"],
  denuncias: ["pendente", "analisada"],
  repasses: ["solicitado", "concluido", "recusado"],
  pagamentos: ["pendente", "confirmado", "cancelado", "reembolsado"],
};

function Numero({
  titulo,
  valor: numero,
}: {
  titulo: string;
  valor: string | number;
}) {
  const { colors, fontsReady } = useTheme();
  return (
    <View style={estilosFixos.grupo1}>
      <Text
        style={{
          fontSize: 27,
          lineHeight: 37,
          color: colors.ink,
          fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
        }}
      >
        {numero}
      </Text>
      <Copy muted>{titulo}</Copy>
    </View>
  );
}
function FluxoFundo({ financeiro: f }: { financeiro: Resumo["financeiro"] }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        gap: 14,
        padding: 20,
        borderRadius: 22,
        backgroundColor: colors.brandSoft,
      }}
    >
      <Heading>Do anúncio ao apoio</Heading>
      <Copy muted>Valores conciliados de demonstração, gravados no MySQL.</Copy>
      <Line label="Receita bruta conciliada" value={dinheiro(f.bruto)} />
      <Line label="Tributos e custos registrados" value={dinheiro(f.custos)} />
      <Line label="Receita líquida elegível" value={dinheiro(f.liquido)} />
      <Progress done={Number(f.fundo)} total={Number(f.liquido)} />
      <Line label="70% para o fundo" value={dinheiro(f.fundo)} />
      <Line label="30% para operação" value={dinheiro(f.operacao)} />
      <View
        style={{
          borderTopWidth: 1,
          borderColor: colors.line,
          paddingTop: 12,
          gap: 10,
        }}
      >
        <Line
          label="Já creditado às campanhas"
          value={dinheiro(f.distribuido)}
        />
        <Line
          label="Retido, aguardando elegibilidade"
          value={dinheiro(f.retido)}
        />
      </View>
    </View>
  );
}

export function PainelAdministrativo() {
  const router = useRouter();
  const pessoa = useSessao();
  const { colors, fontsReady } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const [secao, setSecao] = useState("Visão geral");
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [acao, setAcao] = useState<Acao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [novaReceita, setNovaReceita] = useState(false);
  const [bruto, setBruto] = useState("");
  const [tributos, setTributos] = useState("0,00");
  const [custos, setCustos] = useState("0,00");
  const [referencia, setReferencia] = useState("");
  const [origem, setOrigem] = useState("");
  const [inicio, setInicio] = useState(
    () => new Date().toISOString().slice(0, 8) + "01",
  );
  const [fim, setFim] = useState(() => new Date().toISOString().slice(0, 10));
  const tipo = secoes.find((s) => s.nome === secao)?.tipo || "";
  const admin = !!pessoa?.administrador;
  const chaves = useRef(new Map<string, string>());
  const resumo = useDados<Resumo>(admin ? "/administracao/painel" : null);
  const integracoes = useDados<Integracoes>(
    admin ? "/administracao/painel/integracoes" : null,
  );
  const lista = useDados<Lista>(
    admin && tipo
      ? "/administracao/painel/lista?tipo=" +
          tipo +
          "&pagina=" +
          pagina +
          "&busca=" +
          encodeURIComponent(filtroBusca) +
          "&estado=" +
          encodeURIComponent(estado === "Todos" ? "" : estado)
      : null,
  );
  function mudar(nome: string) {
    setSecao(nome);
    setPagina(1);
    setBusca("");
    setFiltroBusca("");
    setEstado("Todos");
    setErro("");
    setMensagem("");
  }
  function atualizar() {
    resumo.atualizar();
    integracoes.atualizar();
    lista.atualizar();
  }
  async function executar(
    caminho: string,
    metodo: "POST" | "PATCH",
    dados: Record<string, unknown> = {},
  ) {
    setOcupado(true);
    setErro("");
    setMensagem("");
    const id = caminho + JSON.stringify(dados);
    if (!chaves.current.has(id)) chaves.current.set(id, criarChaveOperacao());
    try {
      const r = await requisitar<{ mensagem?: string }>(
        caminho,
        metodo,
        dados,
        chaves.current.get(id),
      );
      chaves.current.delete(id);
      setMensagem(r.mensagem || "Operação registrada com sucesso.");
      atualizar();
      return true;
    } catch (e) {
      setErro(mensagemErro(e));
      return false;
    } finally {
      setOcupado(false);
    }
  }
  async function confirmar() {
    if (!acao) return;
    const { tipo: a, item: i } = acao;
    let sucesso = false;
    if (a === "bloquear")
      sucesso = await executar(
        "/administracao/painel/usuarios/" + i.id,
        "PATCH",
        { bloqueado: !i.bloqueado, motivo },
      );
    if (a === "conciliar" || a === "distribuir")
      sucesso = await executar(
        "/administracao/receitas/" +
          i.id +
          "/" +
          (a === "conciliar" ? "confirmar" : "distribuir"),
        "POST",
        a === "conciliar" ? { conciliacao_confirmada: true } : {},
      );
    if (a === "denuncia")
      sucesso = await executar("/administracao/denuncias/" + i.id, "PATCH");
    if (a === "repetirEmail")
      sucesso = await executar(
        "/administracao/painel/emails/" + i.id + "/repetir",
        "POST",
      );
    if (sucesso) {
      setAcao(null);
      setMotivo("");
    }
  }
  async function salvarReceita() {
    const sucesso = await executar("/administracao/receitas", "POST", {
      bruto: Math.round(converterValor(bruto) * 100),
      tributos: Math.round(converterValor(tributos) * 100),
      custos: Math.round(converterValor(custos) * 100),
      referencia,
      justificativa: origem,
      modo: "simulado",
    });
    if (sucesso) {
      setNovaReceita(false);
      setBruto("");
      setReferencia("");
      setOrigem("");
    }
  }
  const menu = (
    <View style={estilosFixos.grupo2}>
      {secoes.map((s) => (
        <Pressable
          key={s.nome}
          accessibilityRole="button"
          accessibilityLabel={"Administração: " + s.nome}
          accessibilityState={{ selected: secao === s.nome }}
          aria-pressed={secao === s.nome}
          onPress={() => mudar(s.nome)}
          style={({ pressed }) => ({
            minHeight: 46,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor:
              secao === s.nome ? colors.brandSoft : "transparent",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Ionicons
            aria-hidden
            accessible={false}
            name={s.icone}
            size={20}
            color={secao === s.nome ? colors.primary : colors.muted}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 21,
              color: secao === s.nome ? colors.primary : colors.ink,
              fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
            }}
          >
            {s.nome}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  function analisar(id: unknown) {
    router.push({ pathname: "/analise", params: { id: String(id) } });
  }
  function item(r: Registro) {
    if (tipo === "campanhas" || tipo === "urgencias")
      return (
        <Card
          key={r.id}
          title={valor(r, "titulo")}
          subtitle={valor(r, "estado") + " · " + valor(r, "responsavel")}
        >
          {tipo === "campanhas" ? (
            <>
              <Copy muted>
                {valor(r, "categoria")}
                {r.submetida ? " · enviada para análise" : ""}
              </Copy>
              <Line
                label="Recebido / meta de teste"
                value={dinheiro(r.recebido) + " / " + dinheiro(r.meta)}
              />
            </>
          ) : (
            <>
              <Line
                label="Prazo"
                value={valor(r, "prazo_limite").slice(0, 10)}
              />
              <Copy muted>
                Recomendação: {valor(r, "recomendacao")} · {valor(r, "pontos")}{" "}
                pontos. A decisão exige revisão humana.
              </Copy>
            </>
          )}
          <Button
            secondary
            title={
              tipo === "urgencias"
                ? "Analisar pedido de urgência"
                : "Gerenciar campanha"
            }
            onPress={() => analisar(r.id)}
          />
          <Button
            secondary
            title="Acompanhar progresso"
            onPress={() =>
              router.push({ pathname: "/rota", params: { id: String(r.id) } })
            }
          />
        </Card>
      );
    if (tipo === "receitas") {
      const liquido = Number(r.bruto) - Number(r.tributos) - Number(r.custos);
      const fundo = Math.floor((liquido * 70) / 100);
      return (
        <Card
          key={r.id}
          title={valor(r, "referencia")}
          subtitle={valor(r, "estado") + " · demonstração"}
        >
          <Line
            label="Bruto / líquido"
            value={dinheiro(r.bruto) + " / " + dinheiro(liquido)}
          />
          <Line
            label="Fundo (70%) / operação (30%)"
            value={dinheiro(fundo) + " / " + dinheiro(liquido - fundo)}
          />
          <Line label="Créditos distribuídos" value={dinheiro(r.distribuido)} />
          <Copy muted>{valor(r, "justificativa")}</Copy>
          {r.estado === "pendente" ? (
            <Button
              secondary
              title="Conciliar esta receita de teste"
              disabled={ocupado}
              onPress={() => setAcao({ tipo: "conciliar", item: r })}
            />
          ) : r.estado === "confirmada" ? (
            <Button
              title="Distribuir créditos elegíveis"
              disabled={ocupado}
              onPress={() => setAcao({ tipo: "distribuir", item: r })}
            />
          ) : (
            <Copy muted>
              Distribuição finalizada. Retido:{" "}
              {dinheiro(fundo - Number(r.distribuido))}.
            </Copy>
          )}
        </Card>
      );
    }
    if (tipo === "usuarios")
      return (
        <Card key={r.id} title={valor(r, "nome")} subtitle={valor(r, "email")}>
          <Copy>
            {r.administrador
              ? "Administrador"
              : r.bloqueado
                ? "Acesso bloqueado"
                : "Acesso ativo"}{" "}
            · {valor(r, "campanhas")} campanhas ·{" "}
            {r.google ? "Google vinculado" : "Acesso por e-mail"}
          </Copy>
          {!r.administrador ? (
            <Button
              secondary
              title={r.bloqueado ? "Liberar acesso" : "Bloquear acesso"}
              disabled={ocupado}
              onPress={() => {
                setMotivo("");
                setAcao({ tipo: "bloquear", item: r });
              }}
            />
          ) : (
            <Copy muted>
              Permissões administrativas são gerenciadas pelo operador local.
            </Copy>
          )}
        </Card>
      );
    if (tipo === "emails")
      return (
        <Card
          key={r.id}
          title={valor(r, "assunto")}
          subtitle={valor(r, "destinatario")}
        >
          <Tag>{valor(r, "estado")}</Tag>
          <Copy muted>
            {valor(r, "titulo")} · {valor(r, "tentativas")} tentativas
          </Copy>
          <Copy muted>
            {r.enviada_em
              ? "Aceito pelo SMTP em " + quando(r.enviada_em)
              : "Aguardando envio ou nova tentativa."}
            {r.erro_codigo ? " Código: " + valor(r, "erro_codigo") : ""}
          </Copy>
          {r.estado === "falhou" ? (
            <Button
              secondary
              title="Recolocar e-mail na fila"
              disabled={ocupado}
              onPress={() => setAcao({ tipo: "repetirEmail", item: r })}
            />
          ) : null}
        </Card>
      );
    if (tipo === "distribuicoes")
      return (
        <Card
          key={r.id}
          title={valor(r, "titulo")}
          subtitle={dinheiro(r.valor) + " em créditos simulados"}
        >
          <Copy>Origem: {valor(r, "referencia")}</Copy>
          <Copy muted>{quando(r.criada_em)}</Copy>
          <Disclosure title="Critérios desta distribuição">
            <Copy>{JSON.stringify(r.criterios)}</Copy>
          </Disclosure>
          <Button
            secondary
            title="Ver progresso da campanha"
            onPress={() =>
              router.push({
                pathname: "/rota",
                params: { id: valor(r, "campanha_id") },
              })
            }
          />
        </Card>
      );
    if (tipo === "relatorios")
      return (
        <Card
          key={r.id}
          title={valor(r, "provedor") + " · " + valor(r, "conta")}
          subtitle={dinheiro(r.estimado_centavos) + " estimados em BRL"}
        >
          <Copy>
            {valor(r, "inicio").slice(0, 10)} a {valor(r, "fim").slice(0, 10)} ·{" "}
            {Number(r.impressoes).toLocaleString("pt-BR")} impressões
          </Copy>
          <Copy muted>
            Consultado em {quando(r.consultado_em)}. Períodos podem se sobrepor.
            Relatório estimado, sem crédito no fundo.
          </Copy>
        </Card>
      );
    if (tipo === "denuncias")
      return (
        <Card
          key={r.id}
          title={valor(r, "titulo")}
          subtitle={valor(r, "estado") + " · " + valor(r, "motivo")}
        >
          <Copy>{valor(r, "relato")}</Copy>
          <Button
            secondary
            title="Analisar campanha"
            onPress={() => analisar(r.campanha_id)}
          />
          {r.estado === "pendente" ? (
            <Button
              secondary
              title="Concluir análise da denúncia"
              disabled={ocupado}
              onPress={() => setAcao({ tipo: "denuncia", item: r })}
            />
          ) : null}
        </Card>
      );
    if (tipo === "repasses" || tipo === "pagamentos")
      return (
        <Card
          key={r.id}
          title={valor(r, "titulo")}
          subtitle={dinheiro(r.valor) + " · " + valor(r, "estado")}
        >
          <Copy muted>
            {tipo === "pagamentos"
              ? "Doador: " + valor(r, "pessoa") + " · " + valor(r, "meio")
              : valor(r, "finalidade")}
          </Copy>
          {(tipo === "repasses" && r.estado === "solicitado") ||
          (tipo === "pagamentos" && r.estado === "confirmado") ? (
            <Button
              secondary
              title={
                tipo === "repasses"
                  ? "Analisar repasse simulado"
                  : "Analisar reembolso simulado"
              }
              onPress={() =>
                router.push({
                  pathname: "/operacao",
                  params: {
                    id: String(r.id),
                    modo: tipo === "repasses" ? "Repasse" : "Reembolso",
                  },
                })
              }
            />
          ) : null}
        </Card>
      );
    return (
      <Card
        key={r.id}
        title={valor(r, "acao")}
        subtitle={
          (valor(r, "operador") || "Sistema") + " · " + quando(r.criado_em)
        }
      >
        {r.titulo ? <Copy>{valor(r, "titulo")}</Copy> : null}
        <Disclosure title="Detalhes do registro">
          <Copy>
            {typeof r.dados === "string" ? r.dados : JSON.stringify(r.dados)}
          </Copy>
        </Disclosure>
        {r.campanha_id ? (
          <Button
            secondary
            title="Abrir análise da campanha"
            onPress={() => analisar(r.campanha_id)}
          />
        ) : null}
      </Card>
    );
  }
  return (
    <Screen
      variant="ledger"
      title="Administração SOMA"
      heading="Visão da operação."
      subtitle="Campanhas, pessoas e cada origem dos recursos."
    >
      {!pessoa ? (
        <PedirLogin />
      ) : !admin ? (
        <Notice>
          Esta página é exclusiva da administração. Entre com uma conta
          autorizada.
        </Notice>
      ) : (
        <>
          <View
            style={{
              flexDirection: desktop ? "row" : "column",
              gap: 28,
              alignItems: "stretch",
            }}
          >
            <View style={{ width: desktop ? 210 : "100%" }}>
              {desktop ? (
                menu
              ) : (
                <Disclosure title={"Seções do painel · " + secao}>
                  {menu}
                </Disclosure>
              )}
            </View>
            <View style={estilosFixos.grupo3}>
              <View style={estilosFixos.linha1}>
                <View style={estilosFixos.area1}>
                  <Heading>{secao}</Heading>
                  {resumo.dados ? (
                    <Copy muted>
                      Atualizado às{" "}
                      {new Date(resumo.dados.atualizado_em).toLocaleTimeString(
                        "pt-BR",
                      )}
                    </Copy>
                  ) : null}
                </View>
                <Button
                  secondary
                  title="Atualizar painel"
                  onPress={atualizar}
                  disabled={resumo.carregando || ocupado}
                />
              </View>
              {erro ? (
                <Notice error>{erro}</Notice>
              ) : mensagem ? (
                <Notice success>{mensagem}</Notice>
              ) : null}
              <EstadoConexao {...resumo} />
              {secao === "Visão geral" && resumo.dados ? (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 12,
                      borderBottomWidth: 1,
                      borderColor: colors.line,
                      paddingBottom: 12,
                    }}
                  >
                    <Numero
                      titulo="Campanhas no app"
                      valor={resumo.dados.campanhas.reduce(
                        (s, c) => s + Number(c.total),
                        0,
                      )}
                    />
                    <Numero
                      titulo="Pedidos de urgência"
                      valor={resumo.dados.urgencias_pendentes}
                    />
                    <Numero
                      titulo="Pessoas cadastradas"
                      valor={resumo.dados.pessoas.total}
                    />
                  </View>
                  <Heading>Precisam de uma decisão</Heading>
                  <Copy muted>
                    Comece pelos prazos e confira as evidências antes de
                    conceder prioridade.
                  </Copy>
                  {resumo.dados.fila_urgencias.map((r) => (
                    <Card
                      key={r.id}
                      title={valor(r, "titulo")}
                      subtitle={
                        "Urgência " +
                        valor(r, "estado") +
                        " · prazo " +
                        valor(r, "prazo_limite").slice(0, 10)
                      }
                      onPress={() => analisar(r.id)}
                    />
                  ))}
                  {resumo.dados.fila_campanhas.map((r) => (
                    <Card
                      key={r.id}
                      title={valor(r, "titulo")}
                      subtitle="Campanha enviada para publicação"
                      onPress={() => analisar(r.id)}
                    />
                  ))}
                  {!resumo.dados.fila_urgencias.length &&
                  !resumo.dados.fila_campanhas.length ? (
                    <EmptyState title="Fila de análise em dia.">
                      Novas campanhas enviadas e pedidos de urgência aparecerão
                      aqui.
                    </EmptyState>
                  ) : null}
                  <View style={estilosFixos.linha2}>
                    <Button
                      secondary
                      title={
                        resumo.dados.operacoes.denuncias +
                        " denúncias pendentes"
                      }
                      onPress={() => mudar("Denúncias")}
                    />
                    <Button
                      secondary
                      title={
                        resumo.dados.operacoes.repasses +
                        " repasses para analisar"
                      }
                      onPress={() => mudar("Repasses")}
                    />
                  </View>
                  <FluxoFundo financeiro={resumo.dados.financeiro} />
                  <Button
                    secondary
                    title="Acompanhar receita e fundo"
                    onPress={() => mudar("Receita e fundo")}
                  />
                </>
              ) : null}
              {secao === "Receita e fundo" && resumo.dados ? (
                <>
                  <FluxoFundo financeiro={resumo.dados.financeiro} />
                  <Notice>
                    As receitas abaixo são de demonstração. Os relatórios reais
                    do provedor ficam separados e não geram saldo distribuível
                    automaticamente.
                  </Notice>
                  <Button
                    title="Registrar receita de demonstração"
                    onPress={() => {
                      setErro("");
                      setNovaReceita(true);
                    }}
                  />
                  <Button
                    secondary
                    title="Consultar relatórios do provedor"
                    onPress={() => mudar("Relatórios de anúncios")}
                  />
                </>
              ) : null}
              {secao === "Relatórios de anúncios" ? (
                <>
                  <EstadoConexao {...integracoes} />
                  <Notice>
                    Receita estimada de AdSense ou AdMob. A conta do provedor
                    precisa estar aprovada e autorizada. Consultar não insere
                    anúncios nem realiza pagamentos.
                  </Notice>
                  <Field
                    label="Início do relatório (AAAA-MM-DD)"
                    value={inicio}
                    onChangeText={setInicio}
                  />
                  <Field
                    label="Fim do relatório (AAAA-MM-DD)"
                    value={fim}
                    onChangeText={setFim}
                  />
                  <Button
                    title="Consultar provedor e salvar relatório"
                    disabled={
                      ocupado || !integracoes.dados?.publicidade.configurado
                    }
                    onPress={() =>
                      executar(
                        "/administracao/painel/anuncios/importar",
                        "POST",
                        { inicio, fim },
                      )
                    }
                  />
                  {!integracoes.dados?.publicidade.configurado ? (
                    <Button
                      secondary
                      title="Configurar integração de anúncios"
                      onPress={() => mudar("Integrações")}
                    />
                  ) : null}
                </>
              ) : null}
              {secao === "E-mails" ? (
                <>
                  <Copy>
                    Uma decisão de urgência cria o aviso no app e uma entrega
                    persistente no MySQL. “Enviado” significa aceito pelo
                    servidor SMTP; não confirma leitura ou chegada à caixa de
                    entrada.
                  </Copy>
                  <Notice>
                    {integracoes.dados?.email.configurado
                      ? "SMTP configurado. A fila tenta enviar automaticamente e registra falhas."
                      : "Envio aguardando configuração SMTP. As decisões e os avisos no app continuam funcionando."}
                  </Notice>
                </>
              ) : null}
              {secao === "Integrações" ? (
                <>
                  <EstadoConexao {...integracoes} />
                  {integracoes.dados ? (
                    <>
                      <Card
                        title="MySQL e Workbench"
                        subtitle="Conectado ao banco do aplicativo"
                      >
                        <Line
                          label="Banco"
                          value={integracoes.dados.banco.nome}
                        />
                        <Line
                          label="Servidor"
                          value={
                            integracoes.dados.banco.host +
                            ":" +
                            integracoes.dados.banco.porta
                          }
                        />
                        <Line
                          label="Usuário"
                          value={integracoes.dados.banco.usuario}
                        />
                        <Copy muted>
                          O Workbench deve usar estes mesmos dados de conexão. A
                          senha fica na configuração local do servidor.
                        </Copy>
                      </Card>
                      <Card
                        title="Login Google"
                        subtitle={
                          integracoes.dados.google.configurado
                            ? "Credenciais configuradas; valide com uma conta Google"
                            : "Aguardando cliente OAuth Web"
                        }
                      >
                        <Copy>
                          Cadastre o aplicativo no Google Cloud com os escopos
                          básicos de identidade, e-mail e perfil.
                        </Copy>
                        <Copy>
                          Retorno autorizado: {integracoes.dados.google.retorno}
                        </Copy>
                        <Copy muted>
                          Importe o JSON pelo comando google:importar. O segredo
                          permanece no servidor.
                        </Copy>
                        <Button
                          secondary
                          title="Abrir configuração oficial do Google"
                          onPress={() => {
                            void Linking.openURL(
                              "https://console.cloud.google.com/auth/clients",
                            );
                          }}
                        />
                      </Card>
                      <Card
                        title="E-mails de decisão"
                        subtitle={
                          integracoes.dados.email.configurado
                            ? "SMTP configurado"
                            : "Aguardando remetente autenticado"
                        }
                      >
                        <Copy>
                          {integracoes.dados.email.remetente ||
                            "Defina EMAIL_REMETENTE no servidor."}
                        </Copy>
                        <Copy muted>
                          Configure SMTP_HOST, SMTP_PORTA, SMTP_USUARIO e
                          SMTP_SENHA. Para Gmail com verificação em duas etapas,
                          use uma senha de app, nunca a senha comum da conta.
                        </Copy>
                        <Button
                          secondary
                          title="Verificar conexão SMTP"
                          disabled={
                            ocupado || !integracoes.dados.email.configurado
                          }
                          onPress={() =>
                            executar(
                              "/administracao/painel/email/verificar",
                              "POST",
                            )
                          }
                        />
                      </Card>
                      <Card
                        title="Receita de anúncios"
                        subtitle={
                          integracoes.dados.publicidade.configurado
                            ? "Conta de relatórios configurada"
                            : "AdSense/AdMob ainda não conectado"
                        }
                      >
                        <Copy>
                          Use PUBLICIDADE_PROVEDOR, PUBLICIDADE_CONTA,
                          PUBLICIDADE_CLIENT_ID, PUBLICIDADE_CLIENT_SECRET e
                          PUBLICIDADE_REFRESH_TOKEN. A autorização de relatórios
                          é separada do login dos usuários.
                        </Copy>
                        <Copy muted>
                          Estimativas são consultadas em BRL e não são tratadas
                          como dinheiro recebido. O fundo e os repasses atuais
                          continuam sendo uma simulação.
                        </Copy>
                      </Card>
                      <Card
                        title="Avisos no aplicativo"
                        subtitle="Ativos e persistidos no MySQL"
                      >
                        <Copy>
                          O responsável vê a decisão em Avisos e pode abrir a
                          própria solicitação. Notificações push do sistema
                          operacional ainda não estão conectadas.
                        </Copy>
                      </Card>
                    </>
                  ) : null}
                </>
              ) : null}
              {tipo ? (
                <>
                  <View style={estilosFixos.grupo4}>
                    <Field
                      label="Buscar nesta seção"
                      value={busca}
                      onChangeText={setBusca}
                    />
                    <Button
                      secondary
                      title="Aplicar busca"
                      onPress={() => {
                        setFiltroBusca(busca.trim());
                        setPagina(1);
                      }}
                    />
                    {estados[tipo] ? (
                      <Choices
                        label="Situação"
                        options={["Todos", ...estados[tipo]]}
                        selected={estado}
                        onSelect={(v) => {
                          setEstado(v);
                          setPagina(1);
                        }}
                      />
                    ) : null}
                  </View>
                  <EstadoConexao {...lista} />
                  {lista.dados ? (
                    <>
                      <Copy muted>
                        {lista.dados.total} registros encontrados
                      </Copy>
                      {lista.dados.itens.map(item)}
                      {!lista.dados.itens.length ? (
                        <EmptyState
                          title="Nenhum registro nesta seleção."
                          action="Limpar filtros"
                          onPress={() => {
                            setBusca("");
                            setFiltroBusca("");
                            setEstado("Todos");
                            setPagina(1);
                          }}
                        >
                          Os registros salvos no banco aparecerão aqui.
                        </EmptyState>
                      ) : null}
                      <View style={estilosFixos.linha3}>
                        <Button
                          secondary
                          title="Página anterior"
                          disabled={pagina <= 1 || lista.carregando}
                          onPress={() => setPagina((p) => p - 1)}
                        />
                        <Copy>
                          Página {lista.dados.pagina} de {lista.dados.paginas}
                        </Copy>
                        <Button
                          secondary
                          title="Próxima página"
                          disabled={
                            pagina >= lista.dados.paginas || lista.carregando
                          }
                          onPress={() => setPagina((p) => p + 1)}
                        />
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        </>
      )}
      <Dialog
        visible={!!acao}
        title={
          acao?.tipo === "bloquear"
            ? "Alterar acesso desta pessoa?"
            : acao?.tipo === "distribuir"
              ? "Distribuir créditos de demonstração?"
              : acao?.tipo === "conciliar"
                ? "Confirmar conciliação de teste?"
                : acao?.tipo === "repetirEmail"
                  ? "Tentar enviar este e-mail novamente?"
                  : "Concluir análise da denúncia?"
        }
        onClose={() => {
          if (!ocupado) setAcao(null);
        }}
      >
        <Copy>
          {acao
            ? valor(acao.item, "titulo") ||
              valor(acao.item, "nome") ||
              valor(acao.item, "referencia") ||
              valor(acao.item, "destinatario")
            : ""}
        </Copy>
        {acao?.tipo === "bloquear" ? (
          <>
            <Copy>
              O bloqueio encerra as sessões e impede novos acessos. As campanhas
              e o histórico são preservados.
            </Copy>
            <Field
              label="Motivo da decisão"
              multiline
              value={motivo}
              onChangeText={setMotivo}
            />
          </>
        ) : acao?.tipo === "distribuir" ? (
          <Copy>
            Somente campanhas críticas elegíveis, com evidências e prazo
            vigentes, recebem créditos. Há teto por responsável. Nenhum dinheiro
            real é transferido.
          </Copy>
        ) : acao?.tipo === "conciliar" ? (
          <Copy>
            Confirme que conferiu a origem, os tributos e os custos desta
            receita de demonstração. Somente a receita conciliada participa da
            simulação do fundo.
          </Copy>
        ) : acao?.tipo === "repetirEmail" ? (
          <Copy>
            A fila fará uma nova tentativa para o destinatário original. Confira
            o endereço e a configuração do SMTP antes de continuar.
          </Copy>
        ) : (
          <Copy>
            A denúncia será marcada como analisada. A situação da campanha é
            decidida separadamente na análise.
          </Copy>
        )}
        {erro ? <Notice error>{erro}</Notice> : null}
        <Button
          title={ocupado ? "Salvando…" : "Confirmar operação"}
          disabled={ocupado || (acao?.tipo === "bloquear" && !motivo.trim())}
          onPress={confirmar}
        />
        <Button
          secondary
          title="Voltar"
          disabled={ocupado}
          onPress={() => setAcao(null)}
        />
      </Dialog>
      <Dialog
        visible={novaReceita}
        title="Nova receita de demonstração"
        onClose={() => {
          if (!ocupado) setNovaReceita(false);
        }}
      >
        <Copy>
          Nenhuma receita real será criada. Este formulário registra uma
          simulação para conferir a distribuição no banco.
        </Copy>
        <Field
          label="Referência única"
          value={referencia}
          onChangeText={setReferencia}
        />
        <Field
          label="Receita bruta (R$)"
          numeric
          value={bruto}
          onChangeText={setBruto}
        />
        <Field
          label="Tributos (R$)"
          numeric
          value={tributos}
          onChangeText={setTributos}
        />
        <Field
          label="Custos publicitários (R$)"
          numeric
          value={custos}
          onChangeText={setCustos}
        />
        <Field
          label="Origem e justificativa dos custos"
          multiline
          value={origem}
          onChangeText={setOrigem}
        />
        {erro ? <Notice error>{erro}</Notice> : null}
        <Button
          title={ocupado ? "Salvando…" : "Salvar receita pendente"}
          disabled={
            ocupado || !referencia.trim() || !origem.trim() || !bruto.trim()
          }
          onPress={salvarReceita}
        />
      </Dialog>
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  grupo1: { flexGrow: 1, flexBasis: 130, paddingVertical: 12, gap: 4 },
  grupo2: { gap: 4 },
  grupo3: { flex: 1, minWidth: 0, gap: 20 },
  linha1: { flexDirection: "row", alignItems: "center", gap: 12 },
  area1: { flex: 1 },
  linha2: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  grupo4: { gap: 10 },
  linha3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
});
