import {
  StyleSheet,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Circle,
  G,
  Line as SvgLine,
  Path,
  Text as SvgText,
} from "react-native-svg";
import {
  Button,
  Card,
  Choices,
  Copy,
  Dialog,
  Disclosure,
  EmptyState,
  Heading,
  Screen,
  useTheme,
} from "../components/ui";
import { EstadoConexao } from "../components/conexao";
import { useDados } from "../servicos/api";
import { formatarDinheiro, categorias } from "../data/formatacao";
import {
  descricaoNivel,
  regioesBrasil,
  resumirMapa,
} from "../data/prioridade-mapa";
import { mapaDemonstracao } from "../data/mapa-demonstracao";
import type { MapaDados } from "../servicos/soma2";
import cartografia from "../data/mapa-brasil.json";
import { MapaInterativo } from "../components/mapa-interativo";
import {
  ampliarCamera,
  cameraInicial,
  limitarCamera,
  zoomMaximo,
} from "../data/camera-mapa";

const geografia = new Map(cartografia.estados.map((e) => [e.uf, e]));
const chamadas: Record<string, { x: number; y: number }> = {
  RN: { x: 560, y: 157 },
  PB: { x: 560, y: 184 },
  PE: { x: 560, y: 211 },
  AL: { x: 560, y: 238 },
  SE: { x: 548, y: 265 },
  ES: { x: 498, y: 362 },
  RJ: { x: 462, y: 412 },
  DF: { x: 386, y: 295 },
};
const moeda = (centavos: number) => formatarDinheiro(centavos / 100);
const contagemCampanhas = (total: number) =>
  total + (total === 1 ? " campanha" : " campanhas");

function ControleMapa({
  titulo,
  icone,
  desabilitado,
  onPress,
}: {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  desabilitado?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      disabled={desabilitado}
      accessibilityState={{ disabled: !!desabilitado }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        opacity: desabilitado ? 0.4 : pressed ? 0.65 : 1,
      })}
    >
      <Ionicons
        aria-hidden
        accessible={false}
        name={icone}
        size={22}
        color={colors.primary}
      />
    </Pressable>
  );
}

export function MapaSolidario() {
  const router = useRouter();
  const { colors, dark, fontsReady } = useTheme();
  const { width } = useWindowDimensions();
  const [uf, setUf] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [cidade, setCidade] = useState("Todos");
  const [regiao, setRegiao] = useState("Todas");
  const [apenasDinheiro, setApenasDinheiro] = useState(true);
  const [demo, setDemo] = useState(false);
  const [filtros, setFiltros] = useState(false);
  const [camera, setCamera] = useState(cameraInicial);
  const { zoom } = camera;
  const consulta = useDados<MapaDados>(
    demo
      ? null
      : "/mapa" +
          (categoria === "Todas"
            ? ""
            : "?categoria=" + encodeURIComponent(categoria)),
  );
  const fonte = useMemo(
    () =>
      demo
        ? mapaDemonstracao.map((e) => ({
            ...e,
            campanhas: e.campanhas.filter(
              (c) => categoria === "Todas" || c.categoria === categoria,
            ),
          }))
        : consulta.dados?.estados || [],
    [demo, categoria, consulta.dados],
  );
  const resumo = useMemo(
    () => resumirMapa(fonte, cartografia.estados, apenasDinheiro),
    [fonte, apenasDinheiro],
  );
  const porUF = useMemo(
    () => new Map(resumo.ufs.map((e) => [e.uf, e])),
    [resumo.ufs],
  );
  const estadosVisiveis = cartografia.estados.filter(
    (e) => regiao === "Todas" || e.regiao === regiao,
  );
  const estadosAtivos = resumo.ufs.filter(
    (e) => regiao === "Todas" || e.regiao === regiao,
  );
  const selecionado = porUF.get(uf);
  const geoSelecionada = geografia.get(uf);
  const campanhas =
    selecionado?.campanhas.filter(
      (c) => cidade === "Todos" || c.municipio === cidade,
    ) || [];
  const regiaoAtual = resumo.regioes.find((e) => e.nome === regiao);
  const total = estadosAtivos.reduce((s, e) => s + e.campanhas.length, 0);
  const restante = estadosAtivos.reduce((s, e) => s + e.restante, 0);
  const destaque = resumo.regioes.find((e) => e.campanhas > 0);
  const largo = width >= 900;
  const tintas = dark
    ? [colors.soft, "#304C72", "#436496", "#84A7FF", "#B6CEFF"]
    : [colors.soft, "#DCE6FF", "#A6BEFF", "#3157C8", "#1748F5"];
  const fonteForte = fontsReady ? "Manrope-SemiBold" : undefined;
  const mover = (x: number, y: number) =>
    setCamera((c) =>
      limitarCamera({ ...c, x: c.x - x / c.zoom, y: c.y - y / c.zoom }),
    );
  function selecionar(valor: string) {
    setUf(valor);
    setCidade("Todos");
  }
  function selecionarRegiao(valor: string) {
    setRegiao(valor);
    selecionar("");
  }
  function modo(valor: string) {
    setDemo(valor === "Exemplo visual");
    setCategoria("Todas");
    selecionarRegiao("Todas");
  }
  function centralizar() {
    setCamera(cameraInicial);
    selecionarRegiao("Todas");
  }
  const alturaMapa = largo
    ? 480
    : Math.max(270, Math.min(420, (width - 40) * 0.96));
  const vazio =
    !consulta.carregando &&
    !consulta.erro &&
    !demo &&
    !!consulta.dados &&
    !total;

  return (
    <Screen
      title="Mapa Solidário"
      heading="Onde sua ajuda faz falta."
      subtitle="Encontre campanhas por região e entenda o que ainda falta para cada causa."
    >
      <View style={estilosFixos.linha1}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            borderRadius: 14,
            padding: 4,
            backgroundColor: colors.soft,
          }}
        >
          {["Dados do app", "Exemplo visual"].map((v) => (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={"Fonte do mapa: " + v}
              accessibilityState={{
                selected: (demo ? "Exemplo visual" : "Dados do app") === v,
              }}
              aria-pressed={(demo ? "Exemplo visual" : "Dados do app") === v}
              onPress={() => modo(v)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 44,
                paddingHorizontal: 8,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  (demo ? "Exemplo visual" : "Dados do app") === v
                    ? colors.surface
                    : "transparent",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text
                style={{
                  color:
                    (demo ? "Exemplo visual" : "Dados do app") === v
                      ? colors.primary
                      : colors.muted,
                  fontSize: 13,
                  fontFamily: fonteForte,
                  textAlign: "center",
                }}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
        <ControleMapa
          titulo="Filtrar mapa"
          icone="options-outline"
          onPress={() => setFiltros(true)}
        />
      </View>
      <View style={estilosFixos.grupo1}>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 21 }}>
          {regiao === "Todas" ? "Brasil" : regiao} ·{" "}
          {apenasDinheiro ? "doações em aberto" : "todas as ajudas"}
          {categoria !== "Todas" ? " · " + categoria : ""}
        </Text>
        <Text
          style={{
            color: demo ? colors.primary : colors.muted,
            fontSize: 12,
            lineHeight: 20,
          }}
        >
          {demo
            ? "Demonstração: dados fictícios, sem doações reais."
            : "Somente localizações autorizadas. Sem registros não significa sem necessidade."}
        </Text>
      </View>
      {!demo ? (
        <>
          <EstadoConexao {...consulta} />
          {consulta.erro ? (
            <Button
              secondary
              title="Tentar carregar o mapa novamente"
              onPress={consulta.atualizar}
            />
          ) : null}
        </>
      ) : null}

      <View
        style={{
          flexDirection: largo ? "row" : "column",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <View style={estilosFixos.grupo2}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.line,
              overflow: "hidden",
            }}
          >
            <View style={estilosFixos.grupo3}>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 18,
                  fontFamily: fonteForte,
                }}
              >
                {regiao === "Todas" ? "Brasil, causa por causa" : regiao}
              </Text>
              <Text
                style={{ color: colors.muted, fontSize: 13, lineHeight: 21 }}
              >
                {total
                  ? contagemCampanhas(total) +
                    " nesta seleção · " +
                    moeda(restante) +
                    " em aberto"
                  : "Aguardando campanhas com localização autorizada"}
              </Text>
              {demo ? (
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 12,
                    lineHeight: 20,
                  }}
                >
                  Cenário ilustrativo · valores simulados
                </Text>
              ) : null}
            </View>
            <MapaInterativo
              camera={camera}
              onChange={setCamera}
              altura={alturaMapa}
            >
              <Svg
                viewBox={[camera.x, camera.y, 600 / zoom, 580 / zoom].join(" ")}
                width="100%"
                height={alturaMapa}
                accessibilityLabel="Mapa de campanhas por estado. A legenda e a lista abaixo descrevem os mesmos dados."
              >
                {cartografia.estados.map((e) => {
                  const ativo = regiao === "Todas" || e.regiao === regiao;
                  const dados = porUF.get(e.uf);
                  const nivel = dados?.nivel || 0;
                  return (
                    <Path
                      key={e.uf}
                      d={e.caminho}
                      fill={tintas[nivel]}
                      opacity={ativo ? 1 : 0.2}
                      stroke={uf === e.uf ? colors.ink : colors.surface}
                      strokeWidth={uf === e.uf ? 3 : 1.8}
                      onPress={() => {
                        if (ativo) selecionar(e.uf);
                      }}
                    />
                  );
                })}
                {cartografia.estados.map((e) => {
                  if (regiao !== "Todas" && e.regiao !== regiao) return null;
                  const dados = porUF.get(e.uf);
                  const nivel = dados?.nivel || 0;
                  const chamada = chamadas[e.uf];
                  const texto = chamada
                    ? colors.ink
                    : nivel >= 3
                      ? dark
                        ? colors.onPrimary
                        : colors.onHero
                      : colors.ink;
                  return (
                    <G key={e.uf} onPress={() => selecionar(e.uf)}>
                      {chamada ? (
                        <SvgLine
                          x1={e.x}
                          y1={e.y}
                          x2={chamada.x - 8}
                          y2={chamada.y - 4}
                          stroke={colors.muted}
                          strokeWidth={0.9}
                        />
                      ) : null}
                      {uf === e.uf ? (
                        <Circle
                          cx={e.x}
                          cy={e.y}
                          r={15}
                          fill="none"
                          stroke={colors.ink}
                          strokeWidth={1.5}
                        />
                      ) : null}
                      <SvgText
                        x={chamada?.x || e.x}
                        y={chamada?.y || e.y + 4}
                        fill={texto}
                        textAnchor={chamada ? "start" : "middle"}
                        fontSize={12}
                        fontWeight="600"
                      >
                        {e.uf}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </MapaInterativo>
            <View style={estilosFixos.grupo4}>
              <View style={estilosFixos.linha2}>
                <ControleMapa
                  titulo="Afastar mapa"
                  icone="remove"
                  desabilitado={zoom <= 1}
                  onPress={() =>
                    setCamera((c) => ampliarCamera(c, c.zoom - 0.25))
                  }
                />
                <View style={estilosFixos.area1}>
                  <Button
                    secondary
                    title="Brasil inteiro"
                    onPress={centralizar}
                  />
                </View>
                <ControleMapa
                  titulo="Aproximar mapa"
                  icone="add"
                  desabilitado={zoom >= zoomMaximo}
                  onPress={() =>
                    setCamera((c) => ampliarCamera(c, c.zoom + 0.25))
                  }
                />
              </View>
              <Text
                style={{ color: colors.muted, fontSize: 12, lineHeight: 19 }}
              >
                Arraste com o dedo ou mouse. Use dois dedos ou a roda do mouse
                para ampliar. Zoom: {Math.round(zoom * 100)}%.
              </Text>
              <View style={estilosFixos.grupo5}>
                {[4, 3, 2, 1, 0].map((nivel) => (
                  <View key={nivel} style={estilosFixos.linha3}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: tintas[nivel],
                        borderWidth: 1,
                        borderColor: colors.line,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        color: colors.muted,
                        fontSize: 12,
                        lineHeight: 19,
                      }}
                    >
                      {demo && nivel >= 3
                        ? nivel === 4
                          ? "Prioridade crítica · exemplo"
                          : "Prioridade moderada · exemplo"
                        : descricaoNivel(nivel)}
                    </Text>
                  </View>
                ))}
              </View>
              <Disclosure title="Mover o mapa ampliado">
                <Copy muted>
                  Você também pode usar os botões para navegar, sem precisar
                  arrastar.
                </Copy>
                <View style={estilosFixos.linha4}>
                  {(
                    [
                      {
                        titulo: "Mover mapa para a esquerda",
                        icone: "arrow-back",
                        x: 60,
                        y: 0,
                      },
                      {
                        titulo: "Mover mapa para cima",
                        icone: "arrow-up",
                        x: 0,
                        y: 60,
                      },
                      {
                        titulo: "Mover mapa para baixo",
                        icone: "arrow-down",
                        x: 0,
                        y: -60,
                      },
                      {
                        titulo: "Mover mapa para a direita",
                        icone: "arrow-forward",
                        x: -60,
                        y: 0,
                      },
                    ] as const
                  ).map((c) => (
                    <ControleMapa
                      key={c.titulo}
                      titulo={c.titulo}
                      icone={c.icone}
                      desabilitado={zoom <= 1}
                      onPress={() => mover(c.x, c.y)}
                    />
                  ))}
                </View>
              </Disclosure>
            </View>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}>
            Cartografia: IBGE. Localização por UF e município autorizado, sem
            GPS nem endereço residencial.
          </Text>
        </View>

        <View style={{ width: largo ? 300 : "100%", gap: 12 }}>
          <Heading>Onde começar a ajudar</Heading>
          <Copy muted>
            {destaque
              ? destaque.nome +
                " aparece primeiro no recorte nacional desta categoria."
              : "As regiões aparecerão em ordem de prioridade quando houver dados."}
          </Copy>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}>
            Urgências revisadas vêm primeiro. Depois, contam a lacuna financeira
            e o prazo.{" "}
            {demo
              ? "Neste exemplo, todos os dados são fictícios."
              : "O ranking considera apenas os registros do app."}
          </Text>
          {resumo.regioes.map((r, i) => (
            <Pressable
              key={r.nome}
              accessibilityRole="button"
              accessibilityLabel={"Selecionar região " + r.nome}
              accessibilityState={{ selected: regiao === r.nome }}
              aria-pressed={regiao === r.nome}
              onPress={() =>
                selecionarRegiao(regiao === r.nome ? "Todas" : r.nome)
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 90,
                padding: 14,
                borderRadius: 18,
                backgroundColor:
                  regiao === r.nome ? colors.brandSoft : colors.surface,
                borderWidth: 1,
                borderColor: regiao === r.nome ? colors.primary : colors.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: r.campanhas ? colors.brandSoft : colors.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontFamily: fonteForte, color: colors.primary }}>
                  {r.campanhas ? i + 1 : "—"}
                </Text>
              </View>
              <View style={estilosFixos.grupo6}>
                <Text
                  style={{
                    color: colors.ink,
                    fontSize: 16,
                    fontFamily: fonteForte,
                  }}
                >
                  {r.nome}
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 12, lineHeight: 19 }}
                >
                  {r.campanhas
                    ? contagemCampanhas(r.campanhas) +
                      " · " +
                      moeda(r.restante) +
                      " em aberto"
                    : "Sem dados nesta seleção"}
                </Text>
                {r.criticas || r.moderadas ? (
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      lineHeight: 19,
                    }}
                  >
                    {r.criticas
                      ? r.criticas +
                        (r.criticas === 1 ? " crítica" : " críticas")
                      : r.moderadas +
                        (r.moderadas === 1 ? " moderada" : " moderadas")}
                    {demo ? " · exemplo" : " com revisão vigente"}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                aria-hidden
                accessible={false}
                name="chevron-forward"
                size={17}
                color={colors.primary}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {vazio ? (
        <EmptyState
          title="Ainda faltam localizações autorizadas."
          action="Ver exemplo visual do mapa"
          onPress={() => modo("Exemplo visual")}
        >
          Não há campanhas {apenasDinheiro ? "com doações em aberto e " : ""}com
          localização autorizada nesta seleção. Você pode explorar outras causas
          enquanto o mapa recebe novos registros.
        </EmptyState>
      ) : null}
      {regiao !== "Todas" && regiaoAtual ? (
        <View style={estilosFixos.grupo7}>
          <Heading>{regiao}</Heading>
          <Copy>
            {regiaoAtual.campanhas
              ? contagemCampanhas(regiaoAtual.campanhas) + " nesta região."
              : "Nenhuma campanha com dados nesta seleção."}
          </Copy>
          <Button
            secondary
            title="Voltar a todas as regiões"
            onPress={() => selecionarRegiao("Todas")}
          />
        </View>
      ) : null}
      {estadosAtivos.length ? (
        <>
          <Heading>Estados nesta seleção</Heading>
          <View style={estilosFixos.grupo8}>
            {estadosAtivos.map((e) => (
              <Card
                key={e.uf}
                title={e.nome + " · " + e.uf}
                subtitle={
                  contagemCampanhas(e.campanhas.length) +
                  " · " +
                  moeda(e.restante) +
                  " em aberto"
                }
                onPress={() => selecionar(e.uf)}
              />
            ))}
          </View>
        </>
      ) : null}
      <Disclosure title="Escolher um estado pela lista" initiallyOpen={false}>
        <Choices
          label="Estado"
          options={estadosVisiveis.map((e) => e.uf)}
          selected={uf}
          onSelect={selecionar}
        />
      </Disclosure>
      <Dialog
        visible={!!uf}
        title={geoSelecionada?.nome || uf || "Estado"}
        onClose={() => selecionar("")}
      >
        {selecionado ? (
          <>
            <Copy>
              {moeda(selecionado.restante)} ainda faltam nas campanhas desta UF.{" "}
              {demo
                ? "Valores ilustrativos."
                : "Valores financeiros de demonstração."}
            </Copy>
            {selecionado.campanhas.some((c) => !!c.municipio) ? (
              <Choices
                label="Município aproximado"
                options={[
                  "Todos",
                  ...new Set(
                    selecionado.campanhas
                      .map((c) => c.municipio)
                      .filter(Boolean),
                  ),
                ]}
                selected={cidade}
                onSelect={setCidade}
              />
            ) : null}
            {campanhas.map((c) => (
              <Card
                key={c.id}
                title={c.titulo}
                subtitle={
                  (c.municipio ? c.municipio + " · " : "") +
                  moeda(c.restante) +
                  " em aberto"
                }
                onPress={
                  demo
                    ? undefined
                    : () => {
                        selecionar("");
                        router.push({
                          pathname: "/campanha",
                          params: { id: c.id },
                        });
                      }
                }
              >
                <Copy muted>
                  {c.urgencia.revisada
                    ? (c.urgencia.classe === "critica"
                        ? "Prioridade crítica"
                        : "Prioridade moderada") +
                      (demo ? " ilustrativa." : " com revisão vigente.")
                    : "Sem prioridade de urgência atribuída."}
                </Copy>
                {demo ? (
                  <Copy muted>Campanha fictícia, sem botão de doação.</Copy>
                ) : null}
              </Card>
            ))}
          </>
        ) : (
          <EmptyState title="Nenhuma campanha nesta seleção.">
            Isso não significa ausência de necessidade social neste estado. O
            mapa usa somente registros com consentimento.
          </EmptyState>
        )}
      </Dialog>
      <Button
        title="Encontrar uma campanha para ajudar"
        onPress={() => router.push("/explorar")}
      />
      {!demo ? (
        <Button
          secondary
          title="Atualizar dados do mapa"
          disabled={consulta.carregando}
          onPress={consulta.atualizar}
        />
      ) : null}
      <Disclosure title="Entenda as cores e a ordem das regiões">
        <Copy>
          Críticas revisadas vêm antes das moderadas. Em seguida, o indicador
          combina urgência revisada (3 / 1,5 / 0,5), lacuna financeira limitada
          a 3 pontos por campanha e prazo revisado de até sete dias (+1). Não
          concede prioridade nem altera o fundo solidário.
        </Copy>
        <Copy>
          “Maior lacuna” identifica a metade superior dos estados com valor em
          aberto, comparados nesta categoria e forma de ajuda. Esse valor
          sozinho não comprova urgência. O filtro regional mantém a escala do
          Brasil para permitir comparação.
        </Copy>
        <Copy muted>
          Regiões grandes ou com mais usuários podem ter mais registros. A
          ausência de campanhas não mede a necessidade da população. Não são
          usados dados de pobreza, população ou localização do visitante.
        </Copy>
      </Disclosure>
      <Disclosure title="Como uma campanha aparece no mapa">
        <Copy>
          O responsável escolhe se quer divulgar apenas o estado e,
          opcionalmente, o município. A campanha precisa estar publicada.
          Retirar essa autorização também retira o registro do mapa.
        </Copy>
        <Button
          secondary
          title="Abrir minhas campanhas"
          onPress={() => router.push("/minhas-campanhas")}
        />
      </Disclosure>
      <Dialog
        visible={filtros}
        title="Filtrar o mapa"
        onClose={() => setFiltros(false)}
      >
        <Choices
          label="Forma de ajudar"
          options={["Doações em aberto", "Todas as ajudas"]}
          selected={apenasDinheiro ? "Doações em aberto" : "Todas as ajudas"}
          onSelect={(v) => {
            setApenasDinheiro(v === "Doações em aberto");
            selecionar("");
          }}
        />
        <Choices
          label="Região do Brasil"
          options={["Todas", ...regioesBrasil]}
          selected={regiao}
          onSelect={selecionarRegiao}
        />
        <Choices
          label="Categoria no mapa"
          options={["Todas", ...categorias]}
          selected={categoria}
          onSelect={(v) => {
            setCategoria(v);
            selecionar("");
          }}
        />
        <Button title="Aplicar filtros" onPress={() => setFiltros(false)} />
        <Button
          secondary
          title="Limpar filtros"
          onPress={() => {
            setCategoria("Todas");
            selecionarRegiao("Todas");
          }}
        />
      </Dialog>
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  linha1: { flexDirection: "row", gap: 10, alignItems: "center" },
  grupo1: { gap: 5 },
  grupo2: { flex: 1, minWidth: 0, gap: 14 },
  grupo3: { padding: 20, paddingBottom: 0, gap: 6 },
  grupo4: { padding: 16, gap: 14 },
  linha2: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  area1: { flex: 1 },
  grupo5: { gap: 9 },
  linha3: { flexDirection: "row", gap: 10, alignItems: "center" },
  linha4: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  grupo6: { flex: 1, gap: 4 },
  grupo7: { gap: 10 },
  grupo8: { gap: 10 },
});
