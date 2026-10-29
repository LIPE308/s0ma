import { StyleSheet, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Disclosure,
  EmptyState,
  Field,
  Line,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { EstadoConexao } from "../components/conexao";
import { useDados, type Campanha } from "../servicos/api";
import { formatarDinheiro, converterValor } from "../data/formatacao";
import { ResumoArrecadacao, CartaoAnuncios } from "../components/solidariedade";
import type { Marco, Rota } from "../servicos/soma2";
const moeda = (valor: number) => formatarDinheiro(valor / 100);
function Etapas({ marcos }: { marcos: Marco[] }) {
  const { colors, fontsReady } = useTheme();
  const [selecionado, setSelecionado] = useState<Marco | null>(null);
  return (
    <>
      <View>
        {marcos.map((m, i) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={
              m.titulo +
              ": " +
              (m.concluido
                ? "concluído"
                : m.estado === "atual"
                  ? "atual"
                  : "futuro")
            }
            onPress={() => setSelecionado(m)}
            style={estilosFixos.linha1}
          >
            <View style={estilosFixos.area1}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: m.concluido ? colors.hero : colors.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  aria-hidden
                  accessible={false}
                  name={m.concluido ? "checkmark" : "ellipse-outline"}
                  size={18}
                  color={m.concluido ? colors.onHero : colors.primary}
                />
              </View>
              {i < marcos.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: colors.line,
                    marginVertical: 6,
                  }}
                />
              ) : null}
            </View>
            <View style={estilosFixos.grupo1}>
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.ink,
                  fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
                }}
              >
                {m.titulo}
              </Text>
              <Copy muted>
                {m.concluido
                  ? "Concluído"
                  : m.estado === "atual"
                    ? "Próxima conquista"
                    : "Ainda por vir"}
              </Copy>
            </View>
            <Ionicons
              aria-hidden
              accessible={false}
              name="chevron-forward"
              size={18}
              color={colors.muted}
            />
          </Pressable>
        ))}
      </View>
      <Dialog
        visible={!!selecionado}
        title={selecionado?.titulo || "Etapa"}
        onClose={() => setSelecionado(null)}
      >
        <Copy>{selecionado?.detalhe}</Copy>
        <Copy muted>
          Somente registros confirmados contam para esta conquista.
        </Copy>
        <Button title="Entendi" onPress={() => setSelecionado(null)} />
      </Dialog>
    </>
  );
}
export function RotaInteligente() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const campanhas = useDados<Campanha[]>(!id ? "/campanhas" : null);
  const [cenario, setCenario] = useState("");
  const [taxa, setTaxa] = useState("");
  const [dias, setDias] = useState("30");
  const [custos, setCustos] = useState("0,00");
  const [erro, setErro] = useState("");
  const consulta = useDados<Rota>(
    id ? "/campanhas/" + id + "/rota" + cenario : null,
  );
  const rota = consulta.dados;
  function calcular() {
    const t = Number(taxa.replace(",", "."));
    const d = Number(dias);
    const c = Math.round(converterValor(custos) * 100);
    if (
      !taxa.trim() ||
      !Number.isFinite(t) ||
      t < 0 ||
      t > 2 ||
      !Number.isInteger(d) ||
      d < 1 ||
      d > 365 ||
      !Number.isSafeInteger(c) ||
      c < 0
    ) {
      setErro("Informe uma taxa de 0 a 2%, de 1 a 365 dias e custos válidos.");
      return;
    }
    setErro("");
    setCenario("?taxa_mensal=" + t + "&dias=" + d + "&custos=" + c);
  }
  return (
    <Screen
      title="Acompanhamento"
      heading={rota?.campanha.titulo || "Cada gesto faz diferença."}
    >
      {!id ? (
        <>
          <Copy>Escolha uma campanha para acompanhar as contribuições.</Copy>
          <EstadoConexao {...campanhas} />
          {campanhas.dados
            ?.filter((c) => (c.meta_financeira || 0) > 0)
            .map((c) => (
              <Card
                key={c.id}
                title={c.titulo}
                subtitle={
                  moeda(c.recebido_financeiro || 0) +
                  " de " +
                  moeda(c.meta_financeira || 0)
                }
                onPress={() =>
                  router.push({ pathname: "/rota", params: { id: c.id } })
                }
              />
            ))}
          {campanhas.dados &&
          !campanhas.dados.some((c) => (c.meta_financeira || 0) > 0) ? (
            <EmptyState title="Um novo começo.">
              As campanhas com meta financeira aparecerão aqui.
            </EmptyState>
          ) : null}
        </>
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {rota ? (
            <>
              {rota.meta > 0 ? (
                <ResumoArrecadacao rota={rota} />
              ) : (
                <Notice>
                  Esta campanha recebe objetos ou tempo. Cada necessidade tem
                  seu próprio progresso.
                </Notice>
              )}
              {rota.campanha.estado !== "ativa" ? (
                <Notice>
                  A campanha não recebe novas contribuições agora. O histórico
                  permanece disponível.
                </Notice>
              ) : null}
              <Disclosure title="Conquistas da campanha" initiallyOpen>
                <Etapas marcos={rota.marcos} />
              </Disclosure>
              <Disclosure title="De onde vem cada valor">
                <Line
                  label="Doações confirmadas"
                  value={moeda(rota.doacoes_confirmadas)}
                />
                <Line
                  label="Anúncios atribuídos"
                  value={moeda(rota.anuncios_creditados)}
                />
                {rota.saldo_legado !== 0 ? (
                  <>
                    <Line
                      label="Histórico anterior"
                      value={moeda(rota.saldo_legado)}
                    />
                    <Copy muted>
                      Valor preservado dos registros anteriores; não é uma nova
                      doação.
                    </Copy>
                  </>
                ) : null}
                <Line
                  label="Reservado para repasses"
                  value={moeda(rota.reservado)}
                />
                <Line
                  label="Repassado no teste"
                  value={moeda(rota.repassado)}
                />
                <Line
                  label="Disponível no teste"
                  value={moeda(rota.disponivel)}
                />
                <Copy muted>
                  Os valores são simulados. Não há aplicação, rendimento
                  creditado nem movimentação bancária.
                </Copy>
              </Disclosure>
              <CartaoAnuncios rota={rota} />
              <Disclosure title="O que o histórico permite estimar">
                <Copy>{rota.projecao.mensagem}</Copy>
                <Line
                  label="Doações em 30 dias"
                  value={
                    rota.projecao.doacoes
                      ? moeda(rota.projecao.doacoes.mensal)
                      : "Ainda indisponível"
                  }
                />
                <Line
                  label="Prazo estimado para a meta"
                  value={
                    rota.projecao.dias_para_meta === null
                      ? "Ainda indisponível"
                      : rota.projecao.dias_para_meta === 0
                        ? "Meta alcançada"
                        : rota.projecao.dias_para_meta + " dias"
                  }
                />
                {rota.projecao.doacoes ? (
                  <Copy muted>
                    {rota.projecao.doacoes.amostras} contribuições em{" "}
                    {rota.projecao.doacoes.dias} dias.{" "}
                    {rota.projecao.doacoes.hipotese}
                  </Copy>
                ) : (
                  <Copy muted>
                    A projeção exige pelo menos três doações em dias distintos,
                    ao longo de sete dias.
                  </Copy>
                )}
                {rota.projecao.alerta_prazo ? (
                  <Notice>{rota.projecao.alerta_prazo}</Notice>
                ) : null}
                <Copy muted>{rota.projecao.estrategia}</Copy>
              </Disclosure>
              <Disclosure title="Explorar uma hipótese educativa">
                <Copy muted>
                  Você escolhe a hipótese. Nenhum produto ou investimento é
                  oferecido.
                </Copy>
                <Field
                  label="Taxa mensal hipotética (%)"
                  numeric
                  value={taxa}
                  onChangeText={setTaxa}
                />
                <Field
                  label="Prazo em dias"
                  numeric
                  value={dias}
                  onChangeText={setDias}
                />
                <Field
                  label="Custos hipotéticos (R$)"
                  numeric
                  value={custos}
                  onChangeText={setCustos}
                />
                {erro ? <Notice error>{erro}</Notice> : null}
                <Button
                  secondary
                  title="Calcular hipótese"
                  onPress={calcular}
                />
                {rota.projecao.educativa ? (
                  rota.projecao.educativa.bloqueada ? (
                    <Notice>{rota.projecao.educativa.motivo}</Notice>
                  ) : (
                    <>
                      <Line
                        label="Resultado hipotético"
                        value={moeda(rota.projecao.educativa.resultado || 0)}
                      />
                      <Copy muted>{rota.projecao.educativa.hipotese}</Copy>
                    </>
                  )
                ) : null}
              </Disclosure>
              <Button
                title="Ver campanha"
                onPress={() =>
                  router.push({ pathname: "/campanha", params: { id } })
                }
              />
              <Button
                secondary
                title="Atualizar contribuições"
                onPress={consulta.atualizar}
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
  linha1: { flexDirection: "row", gap: 16, minHeight: 76 },
  area1: { alignItems: "center", width: 30 },
  grupo1: { flex: 1, paddingBottom: 22, gap: 5 },
});
