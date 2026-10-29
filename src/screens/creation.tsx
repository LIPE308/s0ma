import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Switch, View } from "react-native";
import {
  Button,
  Card,
  Choices,
  Copy,
  Field,
  Heading,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { PedirLogin } from "../components/conexao";
import {
  categorias,
  converterValor,
  formatarDinheiro,
} from "../data/formatacao";
import {
  requisitar,
  usuarioLogado,
  mensagemErro,
  criarChaveOperacao,
  type Campanha,
} from "../servicos/api";
import { Calendario } from "../components/calendario";
import { CriacaoSimples } from "./criacao-simples";
import { dataDeEventoValida, formatarEvento, lerEvento } from "../data/eventos";

export type PedidoRascunho = {
  id: string;
  nome: string;
  tipo: string;
  meta: string;
  tipo_meta: string;
  prioridade: string;
  prazo: string;
  descricao: string;
};
export type ParametrosRascunho = {
  campanha_id?: string;
  titulo?: string;
  descricao?: string;
  categoria?: string;
  pedidos?: string;
  regiao?: string;
  prazo?: string;
  instrucoes?: string;
  evento?: string;
  editar?: string;
  reabrir?: string;
  avancado?: string;
};
export function lerPedidos(valor?: string): PedidoRascunho[] {
  if (!valor) return [];
  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista)
      ? lista.filter(
          (pedido) =>
            pedido &&
            typeof pedido.id === "string" &&
            typeof pedido.nome === "string",
        )
      : [];
  } catch {
    return [];
  }
}
export function parametrosDaCampanha(campanha: Campanha): ParametrosRascunho {
  return {
    campanha_id: campanha.id,
    titulo: campanha.titulo,
    descricao: campanha.descricao,
    categoria: campanha.categoria,
    regiao: campanha.regiao,
    prazo: campanha.prazo,
    instrucoes: campanha.instrucoes,
    evento: campanha.evento,
    pedidos: JSON.stringify(
      campanha.necessidades.map((pedido) => ({
        ...pedido,
        meta: String(
          pedido.tipo === "dinheiro" ? pedido.meta / 100 : pedido.meta,
        ),
      })),
    ),
  };
}

export function Story() {
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  return !parametros.campanha_id && parametros.avancado !== "1" ? (
    <CriacaoSimples />
  ) : (
    <StoryAdvanced />
  );
}

function StoryAdvanced() {
  const roteador = useRouter();
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  const [titulo, definirTitulo] = useState(parametros.titulo || "");
  const [descricao, definirDescricao] = useState(parametros.descricao || "");
  const [categoria, definirCategoria] = useState(
    parametros.categoria || "Família",
  );
  const [erro, definirErro] = useState("");
  useEffect(() => {
    definirTitulo(parametros.titulo || "");
    definirDescricao(parametros.descricao || "");
    definirCategoria(parametros.categoria || "Família");
  }, [parametros.titulo, parametros.descricao, parametros.categoria]);
  return (
    <Screen
      variant="form"
      title={parametros.campanha_id ? "Editar campanha" : "Criar campanha"}
      step="PASSO 1 DE 4"
      heading="Qual situação precisa de ajuda?"
      back={false}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          <Field
            label="Título da campanha *"
            value={titulo}
            onChangeText={definirTitulo}
          />
          <Field
            label="Descrição e beneficiários *"
            multiline
            value={descricao}
            onChangeText={definirDescricao}
          />
          <Copy muted>
            Você pode ajudar a si ou a outra pessoa. Não publique telefone ou
            endereço particular na história da campanha.
          </Copy>
          {parametros.reabrir === "1" ? (
            <Notice>
              Para reabrir, atualize pelo menos uma meta ou adicione uma
              necessidade. O histórico será preservado.
            </Notice>
          ) : null}
          <Heading>Categoria solidária</Heading>
          <Choices
            options={categorias}
            selected={categoria}
            onSelect={definirCategoria}
          />
          {erro ? <Notice error>{erro}</Notice> : null}
          <Button
            title="Continuar: necessidades"
            onPress={() => {
              if (!titulo.trim() || !descricao.trim()) {
                definirErro("Preencha o título e a descrição.");
                return;
              }
              roteador.push({
                pathname: "/pedidos",
                params: { ...parametros, titulo, descricao, categoria },
              });
            }}
          />
        </>
      )}
    </Screen>
  );
}

export function Requests() {
  const roteador = useRouter();
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  const pedidos = lerPedidos(parametros.pedidos);
  return (
    <Screen
      variant="form"
      title={parametros.campanha_id ? "Editar campanha" : "Criar campanha"}
      step="PASSO 2 DE 4"
      heading="Do que precisa?"
      subtitle="Adicione os itens, valores ou tarefas de que a campanha precisa."
      onBack={() =>
        roteador.replace({ pathname: "/criar", params: parametros })
      }
    >
      {pedidos.map((pedido) => (
        <Card
          key={pedido.id}
          title={pedido.nome}
          subtitle={`${pedido.tipo} · meta ${pedido.tipo === "dinheiro" ? formatarDinheiro(converterValor(pedido.meta)) : pedido.meta}`}
          onPress={() =>
            roteador.push({
              pathname: "/editar-necessidade",
              params: { ...parametros, editar: pedido.id },
            })
          }
        />
      ))}
      {!pedidos.length ? (
        <Notice>Adicione pelo menos uma necessidade para continuar.</Notice>
      ) : null}
      <Button
        secondary
        title="Adicionar necessidade"
        onPress={() =>
          roteador.push({
            pathname: "/editar-necessidade",
            params: { ...parametros, editar: "" },
          })
        }
      />
      <Button
        title="Continuar: organização"
        disabled={!pedidos.length}
        onPress={() =>
          roteador.push({ pathname: "/organizacao", params: parametros })
        }
      />
    </Screen>
  );
}

export function EditRequest() {
  const roteador = useRouter();
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  const pedidos = lerPedidos(parametros.pedidos);
  const original = pedidos.find((pedido) => pedido.id === parametros.editar);
  const [nome, definirNome] = useState(original?.nome || "");
  const [tipo, definirTipo] = useState(original?.tipo || "objeto");
  const [meta, definirMeta] = useState(original?.meta || "");
  const [tipoMeta, definirTipoMeta] = useState(
    original?.tipo_meta || "fechada",
  );
  const [prioridade, definirPrioridade] = useState(
    original?.prioridade || "Normal",
  );
  const [prazo, definirPrazo] = useState(original?.prazo || "");
  const [descricao, definirDescricao] = useState(original?.descricao || "");
  const [erro, definirErro] = useState("");
  function salvar() {
    const valor = converterValor(meta);
    if (
      !nome.trim() ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      (tipo !== "dinheiro" && !Number.isInteger(valor))
    ) {
      definirErro("Informe o nome e uma meta válida, maior que zero.");
      return;
    }
    if (prazo.trim() && !dataDeEventoValida(prazo.trim())) {
      definirErro("Escolha uma data válida ou deixe sem prazo.");
      return;
    }
    const pedido = {
      id: original?.id || `rascunho-${Date.now()}`,
      nome,
      tipo,
      meta,
      tipo_meta: tipoMeta,
      prioridade,
      prazo,
      descricao,
    };
    const novaLista = original
      ? pedidos.map((anterior) =>
          anterior.id === original.id ? pedido : anterior,
        )
      : [...pedidos, pedido];
    roteador.replace({
      pathname: "/pedidos",
      params: { ...parametros, pedidos: JSON.stringify(novaLista), editar: "" },
    });
  }
  return (
    <Screen
      variant="form"
      title={original ? "Editar necessidade" : "Adicionar necessidade"}
      heading="Do que a campanha precisa?"
      subtitle="Os campos com * são obrigatórios."
      onBack={() =>
        roteador.replace({ pathname: "/pedidos", params: parametros })
      }
    >
      <Field
        label="Nome da necessidade *"
        value={nome}
        onChangeText={definirNome}
        placeholder="Ex.: cobertores, livros ou organizar doações"
      />
      <Choices
        label="Tipo de ajuda"
        options={["Dinheiro", "Objeto", "Tarefa"]}
        selected={
          tipo === "dinheiro"
            ? "Dinheiro"
            : tipo === "tarefa"
              ? "Tarefa"
              : "Objeto"
        }
        onSelect={(valor) =>
          definirTipo(
            valor === "Dinheiro"
              ? "dinheiro"
              : valor === "Tarefa"
                ? "tarefa"
                : "objeto",
          )
        }
      />
      <Field
        label={
          tipo === "dinheiro"
            ? "Meta em reais (simulação) *"
            : tipo === "tarefa"
              ? "Número de vagas *"
              : "Quantidade de unidades *"
        }
        numeric
        value={meta}
        onChangeText={definirMeta}
      />
      {tipo === "dinheiro" ? (
        <>
          <Copy muted>
            O valor confirmado no teste conta integralmente para a meta. Nenhum
            dinheiro real é movimentado.
          </Copy>
          <Choices
            label="Limite de arrecadação"
            hint="Fechada: aceita doações até atingir a meta. Aberta: permite continuar recebendo depois da meta."
            options={["Fechada", "Aberta"]}
            selected={tipoMeta === "fechada" ? "Fechada" : "Aberta"}
            onSelect={(valor) =>
              definirTipoMeta(valor === "Fechada" ? "fechada" : "aberta")
            }
          />
        </>
      ) : null}
      <Choices
        label="Ordem de atendimento sugerida"
        hint="Preferência do responsável entre os pedidos. Não concede urgência verificada nem prioridade no fundo solidário."
        options={["Normal", "Alta"]}
        selected={prioridade}
        onSelect={definirPrioridade}
      />
      <Calendario
        label="Prazo para receber ajuda"
        value={prazo}
        onChange={definirPrazo}
        opcional
        permitirPassado={!!parametros.campanha_id}
      />
      <Field
        label="Orientações para quem vai ajudar (opcional)"
        multiline
        value={descricao}
        onChangeText={definirDescricao}
        placeholder="Explique o que doar ou fazer e como combinar a ajuda."
      />
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button title="Salvar necessidade no rascunho" onPress={salvar} />
    </Screen>
  );
}

export function Organization() {
  const { s, colors } = useTheme();
  const roteador = useRouter();
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  const pedidos = lerPedidos(parametros.pedidos);
  const [regiao, definirRegiao] = useState(parametros.regiao || "");
  const [prazo, definirPrazo] = useState(parametros.prazo || "");
  const [instrucoes, definirInstrucoes] = useState(parametros.instrucoes || "");
  const [temEvento, definirTemEvento] = useState(!!parametros.evento);
  const [evento, definirEvento] = useState(parametros.evento || "");
  const [erro, definirErro] = useState("");
  const originalEvento = lerEvento(parametros.evento || "");
  const [legado, definirLegado] = useState(
    !!parametros.evento && !originalEvento,
  );
  const [nomeEvento, definirNomeEvento] = useState(originalEvento?.nome || "");
  const [dataEvento, definirDataEvento] = useState(originalEvento?.data || "");
  const [horaEvento, definirHoraEvento] = useState(
    originalEvento?.horario || "",
  );
  const [localEvento, definirLocalEvento] = useState(
    originalEvento?.local || "",
  );
  const temObjeto = pedidos.some((pedido) => pedido.tipo === "objeto");
  return (
    <Screen
      variant="form"
      title={parametros.campanha_id ? "Editar campanha" : "Criar campanha"}
      step="PASSO 3 DE 4"
      heading="Onde e até quando?"
      onBack={() =>
        roteador.replace({
          pathname: "/pedidos",
          params: { ...parametros, regiao, prazo, instrucoes, evento },
        })
      }
    >
      <Field
        label="Cidade ou região (opcional)"
        value={regiao}
        onChangeText={definirRegiao}
      />
      <Calendario
        label="Prazo da campanha"
        value={prazo}
        onChange={definirPrazo}
        opcional
        permitirPassado={!!parametros.campanha_id}
      />
      <Card
        title={usuarioLogado()?.nome || "Entre na sua conta"}
        subtitle="Responsável pela campanha"
        icon="person-outline"
      />
      {temObjeto ? (
        <Field
          label="Orientações privadas para combinar a entrega"
          multiline
          value={instrucoes}
          onChangeText={definirInstrucoes}
          placeholder="Exibidas após registrar a ajuda. A entrega é combinada diretamente com você."
        />
      ) : null}
      <View style={s.row}>
        <Switch
          accessibilityLabel="Incluir evento gratuito"
          value={temEvento}
          onValueChange={definirTemEvento}
          trackColor={{ false: colors.line, true: colors.primary }}
        />
        <Copy>Incluir um evento gratuito</Copy>
      </View>
      {temEvento ? (
        legado ? (
          <>
            <Field
              label="Nome, data, horário e local da ação *"
              multiline
              value={evento}
              onChangeText={definirEvento}
            />
            <Button
              secondary
              title="Organizar data e local em campos"
              onPress={() => {
                definirNomeEvento(evento);
                definirLegado(false);
              }}
            />
          </>
        ) : (
          <>
            <Field
              label="Nome do evento *"
              value={nomeEvento}
              onChangeText={definirNomeEvento}
            />
            <Calendario
              label="Data do evento"
              value={dataEvento}
              onChange={definirDataEvento}
              permitirPassado={!!parametros.campanha_id}
            />
            <Field
              label="Horário do evento *"
              value={horaEvento}
              onChangeText={definirHoraEvento}
              placeholder="09:00"
            />
            <Field
              label="Local do evento *"
              value={localEvento}
              onChangeText={definirLocalEvento}
              placeholder="Nome do espaço e endereço"
            />
          </>
        )
      ) : null}
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button
        title="Continuar: revisão"
        onPress={() => {
          if (prazo.trim() && !dataDeEventoValida(prazo.trim())) {
            definirErro(
              "Escolha uma data válida ou deixe a campanha sem prazo.",
            );
            return;
          }
          if (
            temEvento &&
            !legado &&
            (!nomeEvento.trim() ||
              !localEvento.trim() ||
              !dataDeEventoValida(dataEvento.trim()) ||
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaEvento.trim()))
          ) {
            definirErro(
              "Informe nome, local, uma data válida (DD/MM/AAAA) e horário (HH:MM) para o evento.",
            );
            return;
          }
          if (temEvento && legado && !evento.trim()) {
            definirErro("Informe os detalhes do encontro.");
            return;
          }
          const eventoFinal = temEvento
            ? legado
              ? evento
              : formatarEvento({
                  nome: nomeEvento,
                  data: dataEvento,
                  horario: horaEvento,
                  local: localEvento,
                })
            : "";
          roteador.push({
            pathname: "/revisao",
            params: {
              ...parametros,
              regiao,
              prazo,
              instrucoes,
              evento: eventoFinal,
            },
          });
        }}
      />
    </Screen>
  );
}

export function CampaignReview() {
  const roteador = useRouter();
  const parametros = useLocalSearchParams<ParametrosRascunho>();
  const pedidos = lerPedidos(parametros.pedidos);
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  const envio = useRef(criarChaveOperacao());
  const [motivo, definirMotivo] = useState("");
  async function salvarCampanha() {
    if (parametros.reabrir === "1" && !motivo.trim()) {
      definirErro("Informe o motivo da reabertura.");
      return;
    }
    definirOcupado(true);
    definirErro("");
    try {
      const reabrindo = parametros.reabrir === "1";
      const campanha = await requisitar<Campanha>(
        parametros.campanha_id
          ? `/campanhas/${parametros.campanha_id}${reabrindo ? "/reabrir" : ""}`
          : "/campanhas",
        reabrindo ? "PATCH" : parametros.campanha_id ? "PUT" : "POST",
        {
          titulo: parametros.titulo,
          descricao: parametros.descricao,
          categoria: parametros.categoria,
          regiao: parametros.regiao,
          prazo: parametros.prazo,
          instrucoes: parametros.instrucoes || "",
          evento: parametros.evento || "",
          motivo_reabertura: reabrindo ? motivo : undefined,
          necessidades: pedidos.map((pedido) => ({
            ...pedido,
            id: pedido.id.startsWith("rascunho-") ? undefined : pedido.id,
            meta:
              pedido.tipo === "dinheiro"
                ? Math.round(converterValor(pedido.meta) * 100)
                : converterValor(pedido.meta),
          })),
        },
        envio.current,
      );
      roteador.replace({
        pathname: "/preparar-campanha",
        params: { id: campanha.id },
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
      title="Revisão da campanha"
      step="PASSO 4 DE 4"
      heading="Uma causa bem explicada."
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : parametros.titulo ? (
        <>
          <Card
            title={parametros.titulo}
            subtitle={`${parametros.categoria} · ${parametros.regiao}`}
          >
            <Copy>{parametros.descricao}</Copy>
            {pedidos.map((pedido) => (
              <Copy key={pedido.id}>
                • {pedido.nome} · {pedido.tipo}
              </Copy>
            ))}
            {parametros.evento ? <Copy>{parametros.evento}</Copy> : null}
          </Card>
          <Copy muted>
            Ao salvar, o rascunho ficará preparado para envio. A publicação
            depende da revisão administrativa.
          </Copy>
          {parametros.reabrir === "1" ? (
            <Field
              label="Motivo da reabertura *"
              multiline
              value={motivo}
              onChangeText={definirMotivo}
            />
          ) : null}
          {erro ? <Notice error>{erro}</Notice> : null}
          <Button
            title={
              ocupado
                ? "Salvando..."
                : parametros.campanha_id
                  ? "Salvar e preparar revisão"
                  : "Salvar rascunho e continuar"
            }
            disabled={ocupado || !pedidos.length}
            onPress={salvarCampanha}
          />
          <Button
            secondary
            title="Editar a história"
            onPress={() =>
              roteador.push({ pathname: "/criar", params: parametros })
            }
          />
        </>
      ) : (
        <>
          <Notice>Comece preenchendo sua campanha.</Notice>
          <Button
            title="Criar campanha"
            onPress={() => roteador.push("/criar")}
          />
        </>
      )}
    </Screen>
  );
}
