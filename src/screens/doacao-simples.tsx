import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Choices,
  Copy,
  Dialog,
  Field,
  Line,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { ConviteCompartilharApp } from "../components/solidariedade";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import {
  useDados,
  usuarioLogado,
  requisitar,
  criarChaveOperacao,
  mensagemErro,
  type Necessidade,
} from "../servicos/api";
import { converterValor, formatarDinheiro } from "../data/formatacao";
export function DoacaoSimples() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const roteador = useRouter();
  const consulta = useDados<Necessidade>(id ? "/necessidades/" + id : null);
  const necessidade = consulta.dados;
  const { colors, fontsReady } = useTheme();
  const [valor, setValor] = useState("20,00");
  const [janela, setJanela] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [pagamento, setPagamento] = useState<number | null>(null);
  const [concluida, setConcluida] = useState(false);
  const chave = useRef(criarChaveOperacao());
  const centavos = Math.round(converterValor(valor) * 100);
  const propria = necessidade?.responsavel_id === usuarioLogado()?.id;
  function revisar() {
    setErro("");
    if (!Number.isSafeInteger(centavos) || centavos < 1000) {
      setErro("Escolha um valor a partir de R$ 10.");
      return;
    }
    setJanela(true);
  }
  async function confirmar() {
    setOcupado(true);
    setErro("");
    try {
      let atual = pagamento;
      if (!atual) {
        const p = await requisitar<{ id: number }>(
          "/pagamentos",
          "POST",
          { necessidade_id: id, valor: centavos, meio: "Simulação" },
          chave.current,
        );
        atual = p.id;
        setPagamento(p.id);
      }
      await requisitar("/pagamentos/" + atual + "/simular", "PATCH", {
        estado: "confirmado",
      });
      setJanela(false);
      setConcluida(true);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  async function cancelar() {
    if (!pagamento) return;
    setOcupado(true);
    try {
      await requisitar("/pagamentos/" + pagamento + "/simular", "PATCH", {
        estado: "cancelado",
      });
      setPagamento(null);
      chave.current = criarChaveOperacao();
      setErro("");
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Screen
      variant="form"
      title="Fazer doação"
      heading={
        concluida ? "Seu gesto foi registrado." : "Quanto você quer somar?"
      }
      subtitle={necessidade?.campanha}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : !id ? (
        <Notice>Escolha uma campanha para começar.</Notice>
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {necessidade ? (
            concluida ? (
              <>
                <View
                  style={{
                    alignItems: "center",
                    padding: 24,
                    backgroundColor: colors.brandSoft,
                    borderRadius: 24,
                    gap: 14,
                  }}
                >
                  <Ionicons name="heart" color={colors.primary} size={48} />
                  <Text
                    style={{
                      fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
                      fontSize: 30,
                      lineHeight: 40,
                      color: colors.ink,
                    }}
                  >
                    {formatarDinheiro(centavos / 100)}
                  </Text>
                  <Copy>Obrigado por somar com esta história.</Copy>
                </View>
                <Notice success>
                  Doação simulada confirmada. Nenhum valor foi cobrado. O
                  registro já conta no progresso desta campanha.
                </Notice>
                <ConviteCompartilharApp />
                <Button
                  title="Voltar à campanha"
                  onPress={() =>
                    roteador.replace({
                      pathname: "/campanha",
                      params: { id: necessidade.campanha_id },
                    })
                  }
                />
                <Button
                  secondary
                  title="Minhas doações"
                  onPress={() => roteador.replace("/atividade")}
                />
              </>
            ) : (
              <>
                <Copy>
                  Sua contribuição apoia {necessidade.nome.toLocaleLowerCase()}.
                </Copy>
                <Notice>
                  Esta é uma doação de demonstração. Não haverá Pix, cobrança no
                  cartão ou transferência de dinheiro.
                </Notice>
                {pagamento ? (
                  <>
                    <Line
                      label="Valor registrado"
                      value={formatarDinheiro(centavos / 100)}
                    />
                    <Copy muted>
                      O envio já foi iniciado. Conclua a confirmação ou cancele
                      antes de mudar o valor.
                    </Copy>
                  </>
                ) : (
                  <>
                    <Field
                      label="Valor da doação (R$)"
                      numeric
                      value={valor}
                      onChangeText={setValor}
                    />
                    <Choices
                      label="Valores sugeridos"
                      options={["20,00", "50,00", "100,00"]}
                      selected={valor}
                      onSelect={setValor}
                    />
                  </>
                )}
                {propria ? (
                  <Notice>
                    Você organiza esta campanha. Acompanhe as contribuições no
                    gerenciamento.
                  </Notice>
                ) : null}
                {erro && !janela ? <Notice error>{erro}</Notice> : null}
                <Button
                  title={pagamento ? "Continuar confirmação" : "Revisar doação"}
                  disabled={
                    ocupado ||
                    propria ||
                    necessidade.campanha_estado !== "ativa" ||
                    necessidade.tipo !== "dinheiro"
                  }
                  onPress={revisar}
                />
                {pagamento ? (
                  <Button
                    secondary
                    title="Cancelar esta simulação"
                    disabled={ocupado}
                    onPress={cancelar}
                  />
                ) : null}
                <Copy muted>
                  Depois de doar, convide alguém para conhecer o SOMA. Mais
                  pessoas podem ampliar o apoio por anúncios às emergências
                  revisadas. Nesta versão, essa receita é simulada.
                </Copy>
                <Copy muted>
                  O valor só conta na meta depois da confirmação. Não há taxas
                  neste teste.
                </Copy>
                <Dialog
                  visible={janela}
                  title="Confira sua doação"
                  onClose={() => {
                    if (!ocupado) setJanela(false);
                  }}
                >
                  <Copy>{necessidade.campanha}</Copy>
                  <Line label="Destino" value={necessidade.nome} />
                  <Line
                    label="Valor simulado"
                    value={formatarDinheiro(centavos / 100)}
                  />
                  <Notice>
                    Nenhum dinheiro será cobrado. Você está confirmando apenas
                    um registro de demonstração.
                  </Notice>
                  {erro ? <Notice error>{erro}</Notice> : null}
                  <Button
                    title={
                      ocupado ? "Confirmando…" : "Confirmar doação simulada"
                    }
                    disabled={ocupado}
                    onPress={confirmar}
                  />
                  <Button
                    secondary
                    title="Voltar e conferir"
                    disabled={ocupado}
                    onPress={() => setJanela(false)}
                  />
                </Dialog>
              </>
            )
          ) : null}
        </>
      )}
    </Screen>
  );
}
