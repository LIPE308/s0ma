import { StyleSheet, Switch, View } from "react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Choices,
  Copy,
  EmptyState,
  Field,
  Heading,
  Line,
  Notice,
  Screen,
  Tag,
} from "../components/ui";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import {
  criarChaveOperacao,
  mensagemErro,
  requisitar,
  useDados,
  usuarioLogado,
} from "../servicos/api";
import { formatarDinheiro, converterValor } from "../data/formatacao";
import type { PainelSoma2 } from "../servicos/soma2";

const moeda = (v: number) => formatarDinheiro(v / 100);
export function TransparenciaAnuncios() {
  const router = useRouter();
  const consulta = useDados<{
    simulado: true;
    liquido: number;
    fundo: number;
    operacao: number;
    distribuido: number;
    retido: number;
    campanhas: { id: string; titulo: string; valor: number }[];
  }>("/fundo");
  const f = consulta.dados;
  return (
    <Screen
      title="Anúncios solidários"
      heading="Um espaço que também pode cuidar."
    >
      <Copy>
        Os anúncios também ajudam. Parte da receita gerada aqui é destinada a
        campanhas que mais precisam.
      </Copy>
      <Tag>Modelo em simulação · sem provedor de anúncios ativo</Tag>
      <Card title="De cada receita líquida elegível">
        <Line label="Fundo para emergências revisadas" value="70%" />
        <Line label="Operação e manutenção do SOMA" value="30%" />
        <Copy muted>
          Líquida significa receita confirmada menos tributos e custos
          publicitários registrados com justificativa. Exibição ou clique não
          gera crédito imediato.
        </Copy>
      </Card>
      <EstadoConexao {...consulta} />
      {f ? (
        <>
          <Card title="O que já foi registrado no teste">
            <Line label="Receita líquida conciliada" value={moeda(f.liquido)} />
            <Line label="Fundo elegível" value={moeda(f.fundo)} />
            <Line label="Operação" value={moeda(f.operacao)} />
            <Line
              label="Créditos simulados distribuídos"
              value={moeda(f.distribuido)}
            />
            <Line label="Valor retido no fundo" value={moeda(f.retido)} />
          </Card>
          <Heading>Campanhas que receberam créditos de teste</Heading>
          {f.campanhas.map((c) => (
            <Card
              key={c.id}
              title={c.titulo}
              subtitle={moeda(Number(c.valor)) + " em créditos simulados"}
              onPress={() =>
                router.push({ pathname: "/rota", params: { id: c.id } })
              }
            />
          ))}
          {!f.campanhas.length ? (
            <EmptyState title="Nenhum crédito distribuído ainda.">
              A administração precisa conciliar uma receita de teste e encontrar
              campanhas críticas elegíveis. Não preenchemos este espaço com
              arrecadação fictícia.
            </EmptyState>
          ) : null}
        </>
      ) : null}
      <Card title="Distribuição com critérios claros">
        <Copy>
          Somente campanhas ativas com urgência crítica revisada, evidência e
          prazo vigentes e uma meta financeira ainda disponível participam. A
          fórmula considera prazo, lacuna relativa e créditos anteriores.
        </Copy>
        <Copy>
          Uma campanha por responsável em cada distribuição. Nenhum responsável
          recebe mais de 35% do fundo daquela receita. O que não pode ser
          alocado permanece retido, sem redistribuição automática.
        </Copy>
        <Copy muted>
          Contas duplicadas podem exigir investigação humana. O sistema não
          certifica identidade nem garante ausência de fraude.
        </Copy>
      </Card>
      {usuarioLogado()?.administrador ? (
        <Button
          title="Abrir simulação administrativa"
          onPress={() => router.push("/fundo-solidario")}
        />
      ) : null}
    </Screen>
  );
}
export function FundoSolidario() {
  const router = useRouter();
  const consulta = useDados<PainelSoma2>(
    usuarioLogado()?.administrador ? "/administracao/soma2" : null,
  );
  const [secao, setSecao] = useState("Receitas");
  const [bruto, setBruto] = useState("1000,00");
  const [tributos, setTributos] = useState("0,00");
  const [custos, setCustos] = useState("0,00");
  const [referencia, setReferencia] = useState(() => "teste-" + Date.now());
  const [justificativa, setJustificativa] = useState("");
  const [conciliada, setConciliada] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const envio = useRef(criarChaveOperacao());
  async function executar(acao: string, id?: number) {
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      if (acao === "criar")
        await requisitar(
          "/administracao/receitas",
          "POST",
          {
            bruto: Math.round(converterValor(bruto) * 100),
            tributos: Math.round(converterValor(tributos) * 100),
            custos: Math.round(converterValor(custos) * 100),
            referencia,
            justificativa,
            modo: "simulado",
          },
          envio.current,
        );
      else
        await requisitar(
          "/administracao/receitas/" + id + "/" + acao,
          "POST",
          acao === "confirmar" ? { conciliacao_confirmada: conciliada } : {},
          envio.current,
        );
      setMensagem(
        acao === "criar"
          ? "Receita de teste salva como pendente."
          : acao === "confirmar"
            ? "Conciliação de teste registrada."
            : "Distribuição concluída. Os créditos simulados já aparecem nas rotas das campanhas.",
      );
      consulta.atualizar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Screen
      variant="ledger"
      title="Fundo solidário"
      heading="Cada crédito precisa de uma origem."
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : !usuarioLogado()?.administrador ? (
        <Notice>Acesso exclusivo da administração.</Notice>
      ) : (
        <>
          <Tag>Painel de simulação administrativa</Tag>
          <Notice>
            Nenhum anúncio real, pagamento, investimento ou transferência é
            realizado. Somente receitas de teste conciliadas podem gerar
            créditos simulados.
          </Notice>
          <Choices
            options={["Receitas", "Urgências", "Lançamentos", "Auditoria"]}
            selected={secao}
            onSelect={setSecao}
          />
          <EstadoConexao {...consulta} />
          {secao === "Receitas" ? (
            <>
              <Card title="Registrar receita demonstrativa">
                <Field
                  label="Referência única da conciliação *"
                  value={referencia}
                  onChangeText={setReferencia}
                />
                <Field
                  label="Receita bruta de teste em reais *"
                  numeric
                  value={bruto}
                  onChangeText={setBruto}
                />
                <Field
                  label="Tributos demonstrativos em reais"
                  numeric
                  value={tributos}
                  onChangeText={setTributos}
                />
                <Field
                  label="Custos publicitários em reais"
                  numeric
                  value={custos}
                  onChangeText={setCustos}
                />
                <Field
                  label="Origem, tributos e custos da simulação *"
                  multiline
                  value={justificativa}
                  onChangeText={setJustificativa}
                />
                <Button
                  title={
                    ocupado ? "Salvando…" : "Salvar receita pendente de teste"
                  }
                  disabled={ocupado}
                  onPress={() => executar("criar")}
                />
              </Card>
              <View style={estilosFixos.linha1}>
                <Switch
                  accessibilityLabel="Confirmei a conciliação da receita de teste"
                  value={conciliada}
                  onValueChange={setConciliada}
                />
                <Copy>Confirmei a conciliação da receita de teste</Copy>
              </View>
              {consulta.dados?.receitas.map((r) => (
                <Card
                  key={r.id}
                  title={r.referencia}
                  subtitle={r.estado + " · simulado"}
                >
                  <Line label="Receita bruta" value={moeda(r.bruto)} />
                  <Line
                    label="Tributos e custos"
                    value={moeda(r.tributos + r.custos)}
                  />
                  <Line label="Líquida elegível" value={moeda(r.liquido)} />
                  <Line label="Fundo solidário (70%)" value={moeda(r.fundo)} />
                  <Line label="Operação (30%)" value={moeda(r.operacao)} />
                  <Line
                    label="Distribuído no teste"
                    value={moeda(Number(r.distribuido))}
                  />
                  <Line label="Retido" value={moeda(r.retido)} />
                  {r.estado === "pendente" ? (
                    <Button
                      secondary
                      title="Confirmar conciliação de teste"
                      disabled={ocupado || !conciliada}
                      onPress={() => executar("confirmar", r.id)}
                    />
                  ) : r.estado === "confirmada" ? (
                    <Button
                      title="Distribuir créditos simulados elegíveis"
                      disabled={ocupado}
                      onPress={() => executar("distribuir", r.id)}
                    />
                  ) : (
                    <Copy muted>
                      Distribuição finalizada e protegida contra duplo crédito.
                      O valor retido não é redistribuído automaticamente.
                    </Copy>
                  )}
                </Card>
              ))}
              {consulta.dados?.receitas.length === 0 ? (
                <EmptyState title="Nenhuma receita registrada.">
                  Use o formulário para criar uma simulação, sem inventar
                  receita publicitária real.
                </EmptyState>
              ) : null}
              <Heading>Distribuições registradas</Heading>
              {consulta.dados?.distribuicoes.map((d) => (
                <Card
                  key={d.id}
                  title={d.campanha}
                  subtitle={
                    moeda(d.valor) + " simulados · receita " + d.receita_id
                  }
                />
              ))}
            </>
          ) : secao === "Urgências" ? (
            <>
              {consulta.dados?.urgencias.map((u) => (
                <Card
                  key={u.campanha_id}
                  title={u.titulo}
                  subtitle={
                    u.estado +
                    " · recomendação " +
                    u.recomendacao +
                    " · " +
                    u.pontos +
                    " pontos"
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/analise",
                      params: { id: u.campanha_id },
                    })
                  }
                />
              ))}
              {consulta.dados?.urgencias.length === 0 ? (
                <EmptyState title="Nenhum pedido de urgência.">
                  Os pedidos enviados pelos responsáveis aparecerão aqui.
                </EmptyState>
              ) : null}
            </>
          ) : secao === "Lançamentos" ? (
            <>
              {consulta.dados?.lancamentos.map((l) => (
                <Card
                  key={l.id}
                  title={l.campanha}
                  subtitle={l.origem + " · " + moeda(l.valor) + " simulados"}
                >
                  <Copy muted>
                    {l.referencia} ·{" "}
                    {new Date(l.criado_em).toLocaleString("pt-BR")}
                  </Copy>
                </Card>
              ))}
              <Copy muted>
                Últimos 100 lançamentos. Valores históricos importados são
                identificados separadamente.
              </Copy>
            </>
          ) : (
            <>
              {consulta.dados?.auditoria.map((a) => (
                <Card
                  key={a.id}
                  title={a.acao}
                  subtitle={
                    "Operador " +
                    a.usuario_id +
                    " · " +
                    new Date(a.criado_em).toLocaleString("pt-BR")
                  }
                />
              ))}
              <Copy muted>
                Últimas 100 operações críticas. Consultas a documentos privados
                também são registradas.
              </Copy>
            </>
          )}
          {erro ? (
            <Notice error>{erro}</Notice>
          ) : mensagem ? (
            <Notice success>{mensagem}</Notice>
          ) : null}
        </>
      )}
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  linha1: { flexDirection: "row", gap: 12, alignItems: "center" },
});
