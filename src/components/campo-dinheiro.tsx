import { Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useTheme } from "./ui";
import { mascararDinheiro } from "../data/dinheiro";
export function CampoDinheiro({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const { colors, fontsReady } = useTheme();
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: 14,
          color: colors.ink,
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
          borderColor: foco ? colors.primary : colors.line,
          borderRadius: 16,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
        }}
      >
        <Text
          accessible={false}
          style={{
            fontSize: 18,
            color: colors.primary,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
          }}
        >
          R$
        </Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(v) => onChangeText(mascararDinheiro(v))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoCorrect={false}
          autoComplete="off"
          placeholder="0,00"
          placeholderTextColor={colors.muted}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 56,
            fontSize: 22,
            color: colors.ink,
            fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
          }}
        />
      </View>
    </View>
  );
}
