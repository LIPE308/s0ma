import { StyleSheet, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Button, Copy, Dialog, useTheme } from "./ui";
import {
  diasDoMes,
  escreverData,
  inicioDoDia,
  lerData,
  meses,
} from "../data/calendario";

export function Calendario({
  label,
  value,
  onChange,
  opcional = false,
  permitirPassado = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opcional?: boolean;
  permitirPassado?: boolean;
}) {
  const { colors, s } = useTheme();
  const [aberto, abrir] = useState(false);
  const [pagina, definirPagina] = useState<"dias" | "meses" | "anos">("dias");
  const data = lerData(value) || inicioDoDia();
  const [ano, definirAno] = useState(data.getFullYear());
  const [mes, definirMes] = useState(data.getMonth());
  const [blocoAno, definirBlocoAno] = useState(
    Math.floor(data.getFullYear() / 12) * 12,
  );
  const hoje = inicioDoDia();
  const desabilitada = (dia: number) =>
    !permitirPassado && new Date(ano, mes, dia, 12) < hoje;
  function abrirCalendario() {
    const d = lerData(value) || hoje;
    definirAno(d.getFullYear());
    definirMes(d.getMonth());
    definirBlocoAno(Math.floor(d.getFullYear() / 12) * 12);
    definirPagina("dias");
    abrir(true);
  }
  function navegar(direcao: number) {
    const d = new Date(ano, mes + direcao, 1, 12);
    if (d.getFullYear() >= 1900 && d.getFullYear() <= 2200) {
      definirAno(d.getFullYear());
      definirMes(d.getMonth());
    }
  }
  return (
    <View style={estilosFixos.grupo1}>
      <Text style={s.label}>
        {label}
        {opcional ? " (opcional)" : ""}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || "Escolher data"}`}
        accessibilityHint="Abre um calendário com escolha de dia, mês e ano"
        onPress={abrirCalendario}
        style={[
          s.input,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          },
        ]}
      >
        <Text style={[s.copy, { color: value ? colors.ink : colors.muted }]}>
          {value || (opcional ? "Sem prazo definido" : "Escolher data")}
        </Text>
        <Ionicons name="calendar-outline" size={23} color={colors.primary} />
      </Pressable>
      {value && !lerData(value) ? (
        <Copy>Escolha uma data válida no calendário.</Copy>
      ) : null}
      <Dialog
        visible={aberto}
        title="Escolha uma data"
        onClose={() => abrir(false)}
      >
        <View style={estilosFixos.linha1}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            onPress={() => navegar(-1)}
            style={s.back}
          >
            <Ionicons name="chevron-back" color={colors.primary} size={23} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Escolher mês: ${meses[mes]}`}
            onPress={() => definirPagina(pagina === "meses" ? "dias" : "meses")}
            style={estilosFixos.area1}
          >
            <Text style={s.label}>{meses[mes]}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Escolher ano: ${ano}`}
            onPress={() => definirPagina(pagina === "anos" ? "dias" : "anos")}
            style={estilosFixos.area2}
          >
            <Text style={s.label}>{ano}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            onPress={() => navegar(1)}
            style={s.back}
          >
            <Ionicons name="chevron-forward" color={colors.primary} size={23} />
          </Pressable>
        </View>
        {pagina === "dias" ? (
          <View>
            <View style={estilosFixos.linha2}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                <Text
                  key={i}
                  style={[
                    s.label,
                    {
                      width: "14.2857%",
                      textAlign: "center",
                      color: colors.muted,
                      paddingVertical: 8,
                    },
                  ]}
                >
                  {dia}
                </Text>
              ))}
            </View>
            <View style={estilosFixos.linha3}>
              {diasDoMes(ano, mes).map((dia, i) => {
                const selecionado =
                  dia !== null &&
                  value === escreverData(new Date(ano, mes, dia, 12));
                const indisponivel = dia !== null && desabilitada(dia);
                return (
                  <View key={i} style={estilosFixos.area3}>
                    {dia !== null ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${dia} de ${meses[mes]} de ${ano}`}
                        accessibilityState={{
                          selected: selecionado,
                          disabled: indisponivel,
                        }}
                        disabled={indisponivel}
                        onPress={() => {
                          onChange(escreverData(new Date(ano, mes, dia, 12)));
                          abrir(false);
                        }}
                        style={{
                          minHeight: 44,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selecionado
                            ? colors.hero
                            : "transparent",
                          opacity: indisponivel ? 0.35 : 1,
                        }}
                      >
                        <Text
                          style={[
                            s.copy,
                            { color: selecionado ? colors.onHero : colors.ink },
                          ]}
                        >
                          {dia}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : pagina === "meses" ? (
          <View style={estilosFixos.linha4}>
            {meses.map((nome, i) => (
              <Pressable
                key={nome}
                accessibilityRole="button"
                accessibilityLabel={nome}
                onPress={() => {
                  definirMes(i);
                  definirPagina("dias");
                }}
                style={[s.choice, { flexBasis: "29%", minHeight: 48 }]}
              >
                <Text style={s.choiceText}>{nome}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={estilosFixos.linha5}>
              <Button
                secondary
                title="Anos anteriores"
                onPress={() => definirBlocoAno((a) => Math.max(1900, a - 12))}
              />
              <Button
                secondary
                title="Anos seguintes"
                onPress={() => definirBlocoAno((a) => Math.min(2189, a + 12))}
              />
            </View>
            <View style={estilosFixos.linha6}>
              {Array.from({ length: 12 }, (_, i) => blocoAno + i).map((a) => (
                <Pressable
                  key={a}
                  accessibilityRole="button"
                  accessibilityLabel={`Ano ${a}`}
                  onPress={() => {
                    definirAno(a);
                    definirPagina("meses");
                  }}
                  style={[s.choice, { flexBasis: "29%", minHeight: 48 }]}
                >
                  <Text style={s.choiceText}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Copy muted>
          {permitirPassado
            ? "Dia, mês e ano no formato brasileiro."
            : "Escolha hoje ou uma data futura."}
        </Copy>
        {opcional ? (
          <Button
            secondary
            title="Deixar sem prazo"
            onPress={() => {
              onChange("");
              abrir(false);
            }}
          />
        ) : null}
      </Dialog>
    </View>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  grupo1: { gap: 8 },
  linha1: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  area1: { padding: 8, minHeight: 44, justifyContent: "center" },
  area2: { padding: 8, minHeight: 44, justifyContent: "center" },
  linha2: { flexDirection: "row" },
  linha3: { flexDirection: "row", flexWrap: "wrap" },
  area3: { width: "14.2857%", minHeight: 44 },
  linha4: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linha5: { flexDirection: "row", gap: 10 },
  linha6: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
