import { StyleSheet, FlatList, Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Choices,
  Copy,
  Dialog,
  Disclosure,
  EmptyState,
  Field,
  useTheme,
} from "../components/ui";
import { EstadoConexao } from "../components/conexao";
import { CartaoCampanha } from "../components/campanhas";
import { useDados, type Campanha, type Necessidade } from "../servicos/api";
import { categorias } from "../data/formatacao";
import { UFS } from "../servicos/soma2";
type Item =
  | { tipo: "campanha"; c: Campanha }
  | { tipo: "pedido"; necessidades: Necessidade };
export function ListaCampanhas() {
  const roteador = useRouter();
  const p = useLocalSearchParams<{
    secao?: string;
    tipo?: string;
    dinheiro?: string;
    regiao?: string;
    entrada?: string;
  }>();
  const { colors, fontsReady } = useTheme();
  const insets = useSafeAreaInsets();
  const [secao, setSecao] = useState("Campanhas");
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [uf, setUf] = useState("Brasil");
  const [urgencia, setUrgencia] = useState("Todas");
  const [janela, setJanela] = useState(false);
  const [dinheiro, setDinheiro] = useState(p.dinheiro === "1");
  useEffect(() => {
    setSecao(
      p.secao === "Voluntariado" || p.tipo === "Tempo"
        ? "Voluntariado"
        : p.secao === "Necessidades" || p.tipo === "Objetos"
          ? "Objetos"
          : p.secao === "Eventos"
            ? "Eventos"
            : "Campanhas",
    );
    setDinheiro(p.dinheiro === "1");
    if (p.regiao === "abrir") setJanela(true);
  }, [p.secao, p.tipo, p.dinheiro, p.regiao, p.entrada]);
  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 250);
    return () => clearTimeout(t);
  }, [busca]);
  const params = new URLSearchParams();
  if (termo) params.set("busca", termo);
  if (categoria !== "Todas") params.set("categoria", categoria);
  if (uf !== "Brasil") params.set("uf", uf);
  if (dinheiro) params.set("min", "1");
  if (urgencia !== "Todas")
    params.set(
      "urgencia",
      urgencia === "Crítica"
        ? "critica"
        : urgencia === "Moderada"
          ? "moderada"
          : "regular",
    );
  const campanhas = useDados<Campanha[]>(
    secao === "Campanhas" || secao === "Eventos"
      ? "/descoberta?" + params.toString()
      : null,
  );
  const necessidades = useDados<Necessidade[]>(
    secao === "Objetos" || secao === "Voluntariado" ? "/necessidades" : null,
  );
  const itens: Item[] =
    secao === "Objetos" || secao === "Voluntariado"
      ? (necessidades.dados || [])
          .filter(
            (v) =>
              v.tipo === (secao === "Objetos" ? "objeto" : "tarefa") &&
              (v.nome + " " + v.campanha + " " + v.descricao)
                .toLocaleLowerCase()
                .includes(termo.toLocaleLowerCase()),
          )
          .map((v) => ({ tipo: "pedido", necessidades: v }))
      : (campanhas.dados || [])
          .filter((c) => secao !== "Eventos" || !!c.evento)
          .map((c) => ({ tipo: "campanha", c }));
  function limpar() {
    setBusca("");
    setTermo("");
    setCategoria("Todas");
    setUf("Brasil");
    setUrgencia("Todas");
    setDinheiro(false);
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={itens}
        keyExtractor={(i) =>
          i.tipo === "campanha" ? i.c.id : i.necessidades.id
        }
        initialNumToRender={6}
        windowSize={5}
        ItemSeparatorComponent={() => <View style={estilosFixos.area1} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: "100%",
          maxWidth: 860,
          alignSelf: "center",
          paddingHorizontal: 20,
          paddingTop: Math.max(20, insets.top + 12),
          paddingBottom: 32,
        }}
        ListHeaderComponent={
          <View style={estilosFixos.grupo1}>
            <View style={estilosFixos.linha1}>
              <Text
                accessibilityRole="header"
                style={{
                  fontSize: 24,
                  lineHeight: 33,
                  color: colors.ink,
                  fontFamily: fontsReady ? "Sora-SemiBold" : undefined,
                }}
              >
                {secao === "Campanhas"
                  ? "Campanhas"
                  : secao === "Objetos"
                    ? "Doar objetos"
                    : secao === "Eventos"
                      ? "Eventos"
                      : "Ser voluntário"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir Mapa Solidário"
                onPress={() => roteador.push("/mapa")}
                style={estilosFixos.area2}
              >
                <Ionicons
                  aria-hidden
                  accessible={false}
                  name="map-outline"
                  color={colors.primary}
                  size={23}
                />
              </Pressable>
            </View>
            <Field
              label={
                secao === "Campanhas"
                  ? "Buscar campanhas"
                  : "Buscar oportunidades"
              }
              value={busca}
              onChangeText={setBusca}
              placeholder="Que causa move você?"
            />
            {secao === "Campanhas" || secao === "Eventos" ? (
              <View style={estilosFixos.linha2}>
                {["Todas", "Família", "Saúde"].map((c) => (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={"Categoria: " + c}
                    accessibilityState={{ selected: categoria === c }}
                    onPress={() => { setCategoria(c); if (c === "Todas") setDinheiro(false); }}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: categoria === c ? colors.hero : colors.line,
                      backgroundColor:
                        categoria === c ? colors.hero : colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: categoria === c ? colors.onHero : colors.ink,
                      }}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Filtrar campanhas"
                  onPress={() => setJanela(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: colors.soft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    aria-hidden
                    accessible={false}
                    name="options-outline"
                    color={colors.primary}
                    size={24}
                  />
                </Pressable>
              </View>
            ) : null}
            {dinheiro && secao === "Campanhas" ? (
              <Copy muted>
                Campanhas com meta financeira · doações de demonstração
              </Copy>
            ) : null}
            <EstadoConexao
              {...(secao === "Objetos" || secao === "Voluntariado"
                ? necessidades
                : campanhas)}
            />
          </View>
        }
        renderItem={({ item }) =>
          item.tipo === "campanha" ? (
            <CartaoCampanha
              compacto
              campanha={item.c}
              evento={secao === "Eventos"}
              aoAbrir={() =>
                roteador.push({
                  pathname: secao === "Eventos" ? "/acao" : "/campanha",
                  params: { id: item.c.id },
                })
              }
            />
          ) : (
            <Card
              title={item.necessidades.nome}
              subtitle={item.necessidades.campanha}
              icon={
                item.necessidades.tipo === "tarefa"
                  ? "people-outline"
                  : "gift-outline"
              }
              onPress={() =>
                roteador.push({
                  pathname: "/necessidade",
                  params: { id: item.necessidades.id },
                })
              }
            >
              <Copy muted>
                {item.necessidades.tipo === "tarefa"
                  ? "Participe com seu tempo."
                  : "Veja como combinar uma entrega."}
              </Copy>
            </Card>
          )
        }
        ListEmptyComponent={
          !(campanhas.carregando || necessidades.carregando) ? (
            <EmptyState
              title="Vamos procurar outro caminho?"
              action="Limpar filtros"
              onPress={limpar}
            >
              Não encontramos uma campanha nesta seleção.
            </EmptyState>
          ) : null
        }
        ListFooterComponent={
          <View style={estilosFixos.area3}>
            <Disclosure title="Outras formas de ajudar">
              <Choices
                label="Forma de ajudar"
                options={["Campanhas", "Objetos", "Voluntariado", "Eventos"]}
                selected={secao}
                onSelect={setSecao}
              />
              <Button
                secondary
                title="Todos os filtros de descoberta"
                onPress={() => roteador.push("/descoberta")}
              />
            </Disclosure>
          </View>
        }
      />
      <Dialog
        visible={janela}
        title="Encontre sua causa"
        onClose={() => setJanela(false)}
      >
        <Choices
          label="Categoria"
          options={["Todas", ...categorias]}
          selected={categoria}
          onSelect={setCategoria}
        />
        <Choices
          label="Urgência revisada"
          options={["Todas", "Crítica", "Moderada", "Regular"]}
          selected={urgencia}
          onSelect={setUrgencia}
        />
        <Choices
          label="Estado"
          options={["Brasil", ...UFS]}
          selected={uf}
          onSelect={setUf}
        />
        <Choices
          label="Contribuição"
          options={["Todas as formas", "Somente dinheiro"]}
          selected={dinheiro ? "Somente dinheiro" : "Todas as formas"}
          onSelect={(v) => setDinheiro(v === "Somente dinheiro")}
        />
        <Button title="Ver campanhas" onPress={() => setJanela(false)} />
        <Button secondary title="Limpar filtros" onPress={limpar} />
      </Dialog>
    </View>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  area1: { height: 12 },
  grupo1: { gap: 18, marginBottom: 20 },
  linha1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  area2: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  linha2: { flexDirection: "row", gap: 8, alignItems: "center" },
  area3: { paddingTop: 24 },
});
