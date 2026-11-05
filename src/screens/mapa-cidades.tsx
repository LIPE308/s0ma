import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, View, useWindowDimensions } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import {
  Button,
  Card,
  Choices,
  Copy,
  Disclosure,
  Notice,
  Screen,
  useTheme,
} from "../components/ui";
import { EstadoConexao } from "../components/conexao";
import { SeletorMunicipio } from "../components/seletor-municipio";
import { MapaInterativo } from "../components/mapa-interativo";
import {
  carregarMalha,
  type TerritorioMunicipal,
} from "../data/malhas-municipais";
import { ampliarCamera, cameraInicial } from "../data/camera-mapa";
import {
  localizarMunicipio,
  nomeMunicipio,
  type Municipio,
} from "../servicos/municipios";
import { useDados } from "../servicos/api";
import { UFS, type MapaDados } from "../servicos/soma2";

const estadoInteiro = { x: 0, y: 0, largura: 600, altura: 580 };
export function MapaCidades() {
  const params = useLocalSearchParams<{ uf?: string }>();
  const [uf, setUf] = useState(
    UFS.includes(params.uf || "") ? params.uf! : "PE",
  );
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState<Municipio | null>(null);
  const [camera, setCamera] = useState(cameraInicial);
  const [enquadrar, setEnquadrar] = useState(false);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const consulta = useDados<MapaDados>("/mapa");
  const malha = useMemo(() => carregarMalha(uf), [uf]);
  const campanhasPorCidade = useMemo(() => {
    const grupos = new Map<
      number,
      NonNullable<MapaDados["estados"][number]>["campanhas"]
    >();
    for (const campanha of consulta.dados?.estados.find((e) => e.uf === uf)
      ?.campanhas || []) {
      const municipio = localizarMunicipio(campanha.municipio, uf);
      if (municipio)
        grupos.set(municipio.id, [
          ...(grupos.get(municipio.id) || []),
          campanha,
        ]);
    }
    return grupos;
  }, [consulta.dados, uf]);
  const territorio = malha?.municipios.find((m) => m.id === cidade?.id);
  const campanhas = cidade ? campanhasPorCidade.get(cidade.id) || [] : [];
  const frame = useMemo(() => {
    if (!enquadrar || !territorio) return estadoInteiro;
    const largura =
      Math.max(territorio.largura, (territorio.altura * 600) / 580, 0.1) * 1.35;
    const altura = (largura * 580) / 600;
    return {
      x: territorio.x + territorio.largura / 2 - largura / 2,
      y: territorio.y + territorio.altura / 2 - altura / 2,
      largura,
      altura,
    };
  }, [enquadrar, territorio]);
  function selecionar(m: Municipio, focar = false) {
    setUf(m.uf);
    setCidade(m);
    setBusca(nomeMunicipio(m));
    setEnquadrar(focar);
    setCamera(cameraInicial);
  }
  function tocar(m: TerritorioMunicipal) {
    selecionar({ id: m.id, nome: m.nome, uf });
  }
  const viewBox = `${frame.x + (camera.x * frame.largura) / 600} ${frame.y + (camera.y * frame.altura) / 580} ${frame.largura / camera.zoom} ${frame.altura / camera.zoom}`;
  return (
    <Screen
      title="Mapa por cidades"
      heading="Cada território, uma comunidade."
      subtitle="Busque uma cidade ou toque em seu território para encontrar campanhas com localização autorizada."
    >
      <SeletorMunicipio
        label="Buscar em todas as cidades do Brasil"
        value={busca}
        onChangeText={setBusca}
        onSelect={(m) => selecionar(m, true)}
      />
      <Disclosure title={`Estado: ${uf} · escolher outra UF`}>
        <Choices
          label="Estado"
          options={UFS}
          selected={uf}
          onSelect={(v) => {
            setUf(v);
            setCidade(null);
            setBusca("");
            setEnquadrar(false);
            setCamera(cameraInicial);
          }}
        />
      </Disclosure>
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.brandSoft,
        }}
      >
        <MapaInterativo
          camera={camera}
          onChange={setCamera}
          altura={width < 600 ? 390 : 510}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            accessibilityLabel={`Territórios municipais de ${uf}`}
          >
            {malha?.municipios.map((m) => {
              const total = campanhasPorCidade.get(m.id)?.length || 0;
              const urgente = campanhasPorCidade
                .get(m.id)
                ?.some(
                  (c) => c.urgencia.classe === "critica" && c.urgencia.revisada,
                );
              return (
                <Path
                  key={m.id}
                  d={m.caminho}
                  fill={
                    cidade?.id === m.id
                      ? colors.primary
                      : urgente
                        ? "#C75B36"
                        : total
                          ? "#4586CB"
                          : "#E5ECF5"
                  }
                  stroke={cidade?.id === m.id ? "#082C92" : "#8FA6C4"}
                  strokeWidth={cidade?.id === m.id ? 1.8 : 0.55}
                  vectorEffect="non-scaling-stroke"
                  fillRule="evenodd"
                  onPress={() => tocar(m)}
                  accessibilityLabel={`${m.nome}, ${uf}: ${total} campanhas`}
                />
              );
            })}
            {territorio && enquadrar ? (
              <SvgText
                x={territorio.x + territorio.largura / 2}
                y={territorio.y + territorio.altura / 2}
                fontSize={frame.largura / 32}
                fontFamily="sans-serif"
                fill="#FFFFFF"
                stroke="#082C92"
                strokeWidth={frame.largura / 1800}
                textAnchor="middle"
                pointerEvents="none"
              >
                {territorio.nome}
              </SvgText>
            ) : null}
          </Svg>
        </MapaInterativo>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          secondary
          title="Ampliar mapa"
          disabled={camera.zoom >= 4}
          onPress={() => setCamera((c) => ampliarCamera(c, c.zoom * 1.5))}
        />
        <Button
          secondary
          title="Reduzir mapa"
          disabled={camera.zoom <= 1}
          onPress={() => setCamera((c) => ampliarCamera(c, c.zoom / 1.5))}
        />
        <Button
          secondary
          title="Ver todo o estado"
          onPress={() => {
            setEnquadrar(false);
            setCamera(cameraInicial);
          }}
        />
      </View>
      <Copy muted>
        Arraste com o dedo ou mouse. Amplie com dois dedos, a roda do mouse ou
        os botões. Azul indica campanhas; terracota indica urgência crítica;
        cinza indica ausência de campanhas localizadas. Essas cores não
        representam taxas de pobreza municipais.
      </Copy>
      <EstadoConexao {...consulta} />
      {cidade ? (
        <Card
          title={nomeMunicipio(cidade)}
          subtitle={`${campanhas.length} ${campanhas.length === 1 ? "campanha" : "campanhas"} com localização autorizada`}
        >
          {territorio ? (
            <Button
              secondary
              title="Focar território da cidade"
              onPress={() => {
                setEnquadrar(true);
                setCamera(cameraInicial);
              }}
            />
          ) : (
            <Notice>
              O IBGE ainda não disponibilizou o contorno deste município nesta
              edição da malha. A cidade está disponível para cadastro.
            </Notice>
          )}
          {campanhas.map((c) => (
            <Card
              key={c.id}
              title={c.titulo}
              subtitle={c.categoria}
              onPress={() =>
                router.push({ pathname: "/campanha", params: { id: c.id } })
              }
            />
          ))}
          {!campanhas.length ? (
            <Copy muted>
              Ainda não há campanhas publicadas com localização autorizada neste
              município. Isso não indica ausência de necessidade.
            </Copy>
          ) : null}
        </Card>
      ) : (
        <Copy>
          Selecione um território no mapa ou encontre uma cidade pela busca.
        </Copy>
      )}
      <Button
        secondary
        title="Voltar ao mapa do Brasil"
        onPress={() => router.push("/mapa")}
      />
      <Copy muted>
        Fonte: IBGE, APIs Localidades e Malhas v3, consultadas em 05/11/2026.
        Catálogo com 5.571 registros e 5.570 contornos, incluindo o Distrito
        Federal. Limites simplificados para navegação, sem endereços
        residenciais.
      </Copy>
      <Button
        secondary
        title="Consultar fonte geográfica"
        onPress={() =>
          Linking.openURL(
            "https://servicodados.ibge.gov.br/api/docs/malhas?versao=3",
          )
        }
      />
    </Screen>
  );
}
