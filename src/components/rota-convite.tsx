import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Copy, Progress, useTheme } from "./ui";
import { useDados } from "../servicos/api";
import type { Inteligencia } from "../screens/inteligencia";
import { formatarDinheiro } from "../data/formatacao";
export function RotaConvite({
  id,
  dados,
}: {
  id: string;
  estado?: string;
  recemCriada?: boolean;
  criador?: boolean;
  dados?: Pick<
    Inteligencia,
    "meta" | "arrecadado" | "percentual" | "marcos" | "campanha"
  > | null;
}) {
  const r = useRouter();
  const { colors } = useTheme();
  const q = useDados<Inteligencia>(
    dados === undefined ? "/campanhas/" + id + "/inteligencia" : null,
  );
  const d = dados === undefined ? q.dados : dados;
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 18,
        backgroundColor: colors.brandSoft,
      }}
    >
      <Copy>
        Acompanhe cada contribuição e o que falta para realizar essa causa.
      </Copy>
      {d && d.meta > 0 ? (
        <>
          <Progress done={d.arrecadado} total={d.meta} />
          <Copy muted>
            {formatarDinheiro(d.arrecadado / 100)} de{" "}
            {formatarDinheiro(d.meta / 100)} · demonstração
          </Copy>
        </>
      ) : null}
      <Button
        secondary
        title="Ver contribuições e progresso"
        onPress={() => r.push({ pathname: "/rota", params: { id } })}
      />
    </View>
  );
}
