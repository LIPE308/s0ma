import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  buscarMunicipios,
  nomeMunicipio,
  type Municipio,
} from "../servicos/municipios";
import { useTheme } from "./ui";
export function SeletorMunicipio({
  value,
  onChangeText,
  onSelect,
  uf = "",
  label = "Cidade (opcional)",
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSelect?: (m: Municipio) => void;
  uf?: string;
  label?: string;
}) {
  const { colors, fontsReady } = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtro = /^[A-Z]{2}$/.test(uf) ? uf : "";
  const items = useMemo(() => buscarMunicipios(value, filtro), [value, filtro]);
  useEffect(
    () => () => {
      if (blur.current) clearTimeout(blur.current);
    },
    [],
  );
  function escolher(m: Municipio) {
    if (blur.current) clearTimeout(blur.current);
    onChangeText(nomeMunicipio(m));
    onSelect?.(m);
    setOpen(false);
  }
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: 14,
          fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: open ? colors.primary : colors.line,
          borderRadius: 14,
          paddingHorizontal: 14,
          backgroundColor: colors.bg,
        }}
      >
        <Ionicons
          name="location-outline"
          color={colors.primary}
          size={20}
          accessible={false}
        />
        <TextInput
          accessibilityRole="combobox"
          accessibilityLabel={label}
          accessibilityState={{ expanded: open && items.length > 0 }}
          autoCorrect={false}
          autoComplete="off"
          placeholder="Digite o nome da cidade"
          placeholderTextColor={colors.muted}
          value={value}
          onFocus={() => {
            if (blur.current) clearTimeout(blur.current);
            setOpen(true);
          }}
          onBlur={() => {
            blur.current = setTimeout(() => setOpen(false), 180);
          }}
          onChangeText={(v) => {
            onChangeText(v);
            setActive(0);
            setOpen(true);
          }}
          onSubmitEditing={() => {
            if (open && items[active]) escolher(items[active]);
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === "ArrowDown" && items.length)
              setActive((a) => Math.min(items.length - 1, a + 1));
            if (e.nativeEvent.key === "ArrowUp")
              setActive((a) => Math.max(0, a - 1));
            if (e.nativeEvent.key === "Escape") setOpen(false);
          }}
          style={{
            flex: 1,
            minHeight: 54,
            minWidth: 0,
            fontSize: 16,
            color: colors.ink,
          }}
        />
      </View>
      {open && value.trim().length >= 2 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          {items.map((m, i) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${m.nome}, ${m.uf}`}
              onPress={() => escolher(m)}
              style={({ pressed }) => ({
                minHeight: 48,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor:
                  pressed || active === i ? colors.brandSoft : colors.surface,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              })}
            >
              <Text style={{ color: colors.ink, fontSize: 15, flex: 1 }}>
                {m.nome}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 13 }}>
                {m.uf}
              </Text>
            </Pressable>
          ))}
          {!items.length ? (
            <Text style={{ padding: 14, color: colors.muted, lineHeight: 21 }}>
              Nenhum município encontrado{filtro ? " nesta UF" : ""}. Confira o
              nome ou o estado.
            </Text>
          ) : null}
        </View>
      ) : null}
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
        Selecione uma cidade da lista do IBGE. Sem endereço residencial.
      </Text>
    </View>
  );
}
