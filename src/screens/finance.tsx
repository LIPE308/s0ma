import { CampoDinheiro } from "../components/campo-dinheiro";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Field,
  Line,
  Metric,
  Notice,
  Screen,
  Tag,
} from "../components/ui";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import { converterValor, formatarDinheiro } from "../data/formatacao";
import {
  useDados,
  requisitar,
  usuarioLogado,
  mensagemErro,
  type Pagamento,
  type Repasse,
  type Saldo,
} from "../servicos/api";

export { DoacaoSimples as Donation } from "./doacao-simples";

export function Payment() {
  const roteador = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const consulta = useDados<Pagamento>(
    id && usuarioLogado() ? `/pagamentos/${id}` : null,
  );
  const pagamento = consulta.dados;
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  async function simular(estado: string) {
    definirOcupado(true);
    try {
      await requisitar(`/pagamentos/${id}/simular`, "PATCH", { estado });
      consulta.atualizar();
    } catch (problema) {
      definirErro(mensagemErro(problema));
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <Screen
      variant="ledger"
      title="Pagamento"
      heading="Pagamento."
      subtitle={pagamento?.campanha}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : !id ? (
        <Notice>Selecione um pagamento na sua atividade.</Notice>
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {pagamento ? (
            <>
              <Tag>{pagamento.estado.toLocaleUpperCase()} ·</Tag>
              <Card
                title={formatarDinheiro(pagamento.valor / 100)}
                subtitle={`${pagamento.meio} · ${pagamento.necessidade}`}
              >
                <Line
                  label="Valor para a meta"
                  value={formatarDinheiro(pagamento.valor_liquido / 100)}
                />
              </Card>
              <Notice>
                A confirmação atualiza a meta e o saldo no MySQL. Não
                existe Pix, cartão ou movimentação de dinheiro real.
              </Notice>
              {pagamento.estado === "pendente" ? (
                <>
                  <Button
                    title="Simular confirmação"
                    disabled={ocupado}
                    onPress={() => simular("confirmado")}
                  />
                  <Button
                    secondary
                    title="Cancelar pagamento"
                    disabled={ocupado}
                    onPress={() => simular("cancelado")}
                  />
                </>
              ) : null}
              {erro ? <Notice error>{erro}</Notice> : null}
              <Button
                secondary
                title="Atualizar status"
                onPress={consulta.atualizar}
              />
              <Button
                title="Minha atividade"
                onPress={() => roteador.replace("/atividade")}
              />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

export function Balance() {
  const roteador = useRouter();
  const { campanha } = useLocalSearchParams<{ campanha?: string }>();
  const identificador = campanha || "biblioteca";
  const consulta = useDados<Saldo>(
    usuarioLogado() ? `/campanhas/${identificador}/saldo` : null,
  );
  const saldo = consulta.dados;
  return (
    <Screen
      variant="ledger"
      title="Saldo e repasses"
      heading="Cada valor tem um estado."
      subtitle={saldo?.campanha}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {saldo ? (
            <>
              <Tag>SALDO</Tag>
              <Metric
                label="Disponível"
                value={formatarDinheiro(saldo.disponivel / 100)}
              />
              <Card title="Resumo da campanha" icon="wallet-outline">
                <Line
                  label="Líquido confirmado"
                  value={formatarDinheiro(saldo.confirmado / 100)}
                />
                <Line
                  label="Solicitações reservadas"
                  value={formatarDinheiro(saldo.reservado / 100)}
                />
                <Line
                  label="Repasses concluídos"
                  value={formatarDinheiro(saldo.repassado / 100)}
                />
              </Card>
              {saldo.repasses.map((repasse) => (
                <Card
                  key={repasse.id}
                  title={formatarDinheiro(repasse.valor / 100)}
                  subtitle={repasse.estado}
                  onPress={() =>
                    roteador.push({
                      pathname: "/repasse",
                      params: { id: String(repasse.id) },
                    })
                  }
                />
              ))}
              <Button
                title="Solicitar repasse"
                disabled={saldo.disponivel <= 0}
                onPress={() =>
                  roteador.push({
                    pathname: "/solicitar-repasse",
                    params: { campanha: identificador },
                  })
                }
              />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

export function RequestTransfer() {
  const roteador = useRouter();
  const { campanha } = useLocalSearchParams<{ campanha?: string }>();
  const identificador = campanha || "biblioteca";
  const consulta = useDados<Saldo>(
    usuarioLogado() ? `/campanhas/${identificador}/saldo` : null,
  );
  const [valor, definirValor] = useState("250,00");
  const [finalidade, definirFinalidade] = useState("");
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  async function solicitar() {
    definirOcupado(true);
    try {
      const centavos = Math.round(converterValor(valor) * 100);
      if (!Number.isSafeInteger(centavos) || centavos <= 0)
        throw new Error("Informe um valor maior que zero.");
      const repasse = await requisitar<{ id: number }>("/repasses", "POST", {
        campanha_id: identificador,
        valor: centavos,
        finalidade,
      });
      roteador.replace({
        pathname: "/repasse",
        params: { id: String(repasse.id) },
      });
    } catch (problema) {
      definirErro(mensagemErro(problema));
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <Screen
      variant="form"
      title="Solicitar repasse"
      heading="Ajuda pode chegar agora."
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {consulta.dados ? (
            <>
              <Copy>
                Disponível:{" "}
                {formatarDinheiro(consulta.dados.disponivel / 100)}
              </Copy>
              <CampoDinheiro
                label="Valor em reais *"
                value={valor}
                onChangeText={definirValor}
              />
              <Field
                label="Finalidade *"
                multiline
                value={finalidade}
                onChangeText={definirFinalidade}
              />
              <Notice>
                A solicitação reserva saldo no sistema e aguarda decisão do
                administrador. Não ocorre transferência bancária.
              </Notice>
              {erro ? <Notice error>{erro}</Notice> : null}
              <Button
                title="Salvar solicitação"
                disabled={ocupado}
                onPress={solicitar}
              />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

export function TransferDetails() {
  const roteador = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const consulta = useDados<Repasse>(
    id && usuarioLogado() ? `/repasses/${id}` : null,
  );
  const repasse = consulta.dados;
  const [janela, definirJanela] = useState(false);
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  async function cancelar() {
    definirOcupado(true);
    try {
      await requisitar(`/repasses/${id}/cancelar`, "PATCH");
      definirJanela(false);
      consulta.atualizar();
    } catch (problema) {
      definirErro(mensagemErro(problema));
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <Screen
      variant="ledger"
      title="Detalhe do repasse"
      heading="Solicitação."
      subtitle={repasse?.campanha}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : !id ? (
        <Notice>Selecione uma solicitação na tela de saldo.</Notice>
      ) : (
        <>
          <EstadoConexao {...consulta} />
          {repasse ? (
            <>
              <Tag>{repasse.estado.toLocaleUpperCase()} ·</Tag>
              <Card
                title={formatarDinheiro(repasse.valor / 100)}
                subtitle={repasse.finalidade}
              />
              {repasse.motivo ? <Copy>{repasse.motivo}</Copy> : null}
              <Notice>
                O estado está salvo no MySQL. Nenhum dinheiro real foi
                transferido.
              </Notice>
              {repasse.estado === "solicitado" ? (
                <Button
                  danger
                  title="Cancelar solicitação"
                  onPress={() => definirJanela(true)}
                />
              ) : null}
              <Button
                secondary
                title="Voltar ao saldo"
                onPress={() =>
                  roteador.replace({
                    pathname: "/saldo",
                    params: { campanha: repasse.campanha_id },
                  })
                }
              />
            </>
          ) : null}
        </>
      )}
      <Dialog
        visible={janela}
        title="Cancelar esta solicitação?"
        onClose={() => definirJanela(false)}
      >
        <Copy>O saldo reservado voltará a ficar disponível no sistema.</Copy>
        {erro ? <Notice error>{erro}</Notice> : null}
        <Button
          danger
          title="Confirmar cancelamento"
          disabled={ocupado}
          onPress={cancelar}
        />
      </Dialog>
    </Screen>
  );
}

export function Surplus() {
  const roteador = useRouter();
  return (
    <Screen title="Meta financeira" heading="A meta fechada tem um limite.">
      <Notice>
        Nesta versão básica, o servidor recusa pagamentos que
        ultrapassem o restante da meta fechada. Pagamentos pendentes já reservam
        esse restante.
      </Notice>
      <Copy>
        Não há fluxo automático de excedentes ou prazo de reembolso. O
        administrador pode registrar o reembolso de um pagamento
        confirmado, se houver saldo disponível.
      </Copy>
      <Button
        title="Minha atividade"
        onPress={() => roteador.replace("/atividade")}
      />
    </Screen>
  );
}
