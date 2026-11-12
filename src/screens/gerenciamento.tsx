import { permiteAnuncios } from "../servicos/campanhas-exemplos";
import { SimuladorCampanha } from "../components/simulador-campanha";
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Dialog,
  Disclosure,
  Field,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { EstadoConexao, PedirLogin } from "../components/conexao";
import { ImagemPrivada } from "../components/arquivos";
import { FotoDeCampanha } from "../components/fotos";
import {
  BotaoCompartilhar,
  CartaoAnuncios,
  ResumoArrecadacao,
} from "../components/solidariedade";
import {
  useDados,
  usuarioLogado,
  requisitar,
  mensagemErro,
  type Campanha,
} from "../servicos/api";
import type { PedidoUrgencia, Rota } from "../servicos/soma2";
import { parametrosDaCampanha } from "./creation";
import { formatarDinheiro } from "../data/formatacao";
export function Gerenciar() {
  const r = useRouter();
  const { id, salvo } = useLocalSearchParams<{ id?: string; salvo?: string }>();
  const p = usuarioLogado();
  const q = useDados<Campanha>(id && p ? "/campanhas/" + id : null);
  const c = q.dados;
  const rota = useDados<Rota>(id && p ? "/campanhas/" + id + "/rota" : null);
  const { colors } = useTheme();
  const [janela, setJanela] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const permitido = c && p && (c.usuario_id === p.id || p.administrador);
  const urgencia = useDados<PedidoUrgencia>(id && permitido ? "/campanhas/" + id + "/urgencia" : null, true);
  const revisada = Boolean(c?.urgencia?.revisada && c.urgencia.classe !== "regular");
  const aguardando = ["pendente", "recurso"].includes(urgencia.dados?.solicitacao?.estado || "");
  async function encerrar() {
    setOcupado(true);
    setErro("");
    try {
      await requisitar("/campanhas/" + id + "/encerrar", "PATCH", { motivo });
      setJanela(false);
      q.atualizar();
      rota.atualizar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  const situacao =
    c?.estado === "rascunho"
      ? c.submetida
        ? "Em análise"
        : "Em preparação"
      : c?.estado === "ativa"
        ? "Campanha publicada"
        : c?.estado === "encerrada"
          ? "Campanha encerrada"
          : c?.estado === "ajustes"
            ? "Ajustes solicitados"
            : "Campanha suspensa";
  return (
    <Screen title="Minha campanha">
      <EstadoConexao {...q} />
      {!p ? (
        <PedirLogin />
      ) : !id ? (
        <Notice>Escolha uma campanha no seu perfil.</Notice>
      ) : c && !permitido ? (
        <Notice>Somente o responsável pode gerenciar esta campanha.</Notice>
      ) : c ? (
        <>
          <SimuladorCampanha
            apoioAnuncios={permiteAnuncios(c)}
            key={c.id}
            campanhaId={c.id}
            confirmado={c.necessidades
              .filter((n) => n.tipo === "dinheiro")
              .reduce((s, n) => s + n.recebido, 0)}
            meta={c.necessidades
              .filter((n) => n.tipo === "dinheiro")
              .reduce((s, n) => s + n.meta, 0)}
            automatico
          />
          {salvo ? (
            <Notice success>
              {salvo === "enviada"
                ? c.estado === "ativa"
                  ? "Campanha publicada. Ela já está disponível em Causas."
                  : "Campanha enviada para revisão. Acompanhe por aqui."
                : "Rascunho salvo. Continue no seu ritmo."}
            </Notice>
          ) : null}
          <View style={estilosFixos.area1}>
            {c.imagem_id ? (
              <ImagemPrivada id={c.imagem_id} altura={190} />
            ) : (
              <FotoDeCampanha
                campanhaId={c.id}
                categoria={c.categoria}
                height={190}
              />
            )}
          </View>
          <View style={estilosFixos.grupo1}>
            <Copy muted>{situacao}</Copy>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 23,
                lineHeight: 32,
                fontWeight: "600",
                color: colors.ink,
              }}
            >
              {c.titulo}
            </Text>
          </View>
          {["ativa", "rascunho", "ajustes"].includes(c.estado) ? (
            <Card title="Urgência e apoio por anúncios">
              <Copy>{revisada ? "Urgência aprovada: sua campanha tem prioridade em Causas." : aguardando ? "Pedido enviado. A administração está analisando sua solicitação de urgência." : "Sua campanha precisa de ajuda imediata? Envie o caso para revisão do administrador."}</Copy>
              <Copy muted>Após aprovação como urgência crítica, a campanha fica acima das causas comuns e pode receber apoio do fundo de anúncios, conforme a receita disponível e os critérios de distribuição.</Copy>
              <Button title={revisada ? "Ver decisão de urgência" : aguardando ? "Acompanhar pedido de urgência" : "Solicitar urgência"} onPress={() => r.push({pathname:"/urgencia",params:{id:c.id}})}/>
            </Card>
          ) : null}
          {rota.dados && rota.dados.meta > 0 ? (
            <>
              <ResumoArrecadacao rota={rota.dados} />
              {permiteAnuncios(c) ? <CartaoAnuncios rota={rota.dados} /> : null}
            </>
          ) : null}
          {c.estado === "ativa" || c.estado === "encerrada" ? (
            <BotaoCompartilhar id={c.id} titulo={c.titulo} principal />
          ) : (
            <Button
              title={
                c.submetida
                  ? "Acompanhar análise"
                  : "Preparar envio para análise"
              }
              onPress={() =>
                r.push({ pathname: "/preparar-campanha", params: { id: c.id } })
              }
            />
          )}
          <Button
            secondary
            title="Editar campanha"
            onPress={() =>
              r.push({ pathname: "/criar", params: parametrosDaCampanha(c) })
            }
          />
          <Disclosure title="Contribuições e progresso">
            <Button
              secondary
              title="Ver contribuições e progresso"
              onPress={() =>
                r.push({ pathname: "/rota", params: { id: c.id } })
              }
            />
            <Button
              secondary
              title="Confirmar ajudas recebidas"
              onPress={() =>
                r.push({ pathname: "/confirmar", params: { campanha: c.id } })
              }
            />
            {c.necessidades.map((n) => (
              <Card
                key={n.id}
                title={n.nome}
                subtitle={
                  n.tipo === "dinheiro"
                    ? formatarDinheiro(n.recebido / 100) +
                      " de " +
                      formatarDinheiro(n.meta / 100)
                    : n.recebido + " de " + n.meta + " confirmados"
                }
              />
            ))}
            {rota.dados?.meta ? (
              <Button
                secondary
                title="Registros financeiros"
                onPress={() =>
                  r.push({ pathname: "/saldo", params: { campanha: c.id } })
                }
              />
            ) : null}
          </Disclosure>
          <Disclosure title="Fotos, documentos e prioridade">
            <Button
              secondary
              title="Foto e documentos privados"
              onPress={() =>
                r.push({ pathname: "/preparar-campanha", params: { id: c.id } })
              }
            />
            <Copy muted>
              A prioridade é atribuída após análise humana de evidências. Enviar
              documentos não garante urgência.
            </Copy>
          </Disclosure>
          <Disclosure title="Atualizações e outras ferramentas">
            <Button
              secondary
              title="Ver página da campanha"
              onPress={() =>
                r.push({ pathname: "/campanha", params: { id: c.id } })
              }
            />
            <Button
              secondary
              title="Publicar atualização"
              onPress={() =>
                r.push({ pathname: "/publicar", params: { campanha: c.id } })
              }
            />
            <Button
              secondary
              title="Resultado e impacto"
              onPress={() =>
                r.push({ pathname: "/resultado", params: { id: c.id } })
              }
            />
            <Button
              secondary
              title="Adicionar outra necessidade"
              onPress={() =>
                r.push({
                  pathname: "/editar-necessidade",
                  params: parametrosDaCampanha(c),
                })
              }
            />
          </Disclosure>
          <Disclosure title="Situação da campanha">
            {c.motivo ? <Copy>{c.motivo}</Copy> : null}
            {c.estado === "ativa" ? (
              <Button
                danger
                title="Encerrar campanha"
                onPress={() => setJanela(true)}
              />
            ) : c.estado === "encerrada" ? (
              <>
                <Copy>
                  O histórico é preservado. A reabertura depende de revisão das
                  metas e nova análise.
                </Copy>
                <Button
                  title="Revisar metas e reabrir"
                  onPress={() =>
                    r.push({
                      pathname: "/criar",
                      params: { ...parametrosDaCampanha(c), reabrir: "1" },
                    })
                  }
                />
              </>
            ) : (
              <Copy>
                A campanha não recebe contribuições enquanto não estiver
                publicada.
              </Copy>
            )}
          </Disclosure>
        </>
      ) : null}
      <Dialog
        visible={janela}
        title="Encerrar esta campanha?"
        onClose={() => setJanela(false)}
      >
        <Copy>
          Novas contribuições ficam bloqueadas. O histórico continua disponível.
        </Copy>
        <Field
          label="Motivo do encerramento"
          multiline
          value={motivo}
          onChangeText={setMotivo}
        />
        {erro ? <Notice error>{erro}</Notice> : null}
        <Button
          danger
          title="Confirmar encerramento"
          disabled={ocupado || !motivo.trim()}
          onPress={encerrar}
        />
      </Dialog>
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  area1: { height: 190, borderRadius: 24, overflow: "hidden" },
  grupo1: { gap: 8 },
});
