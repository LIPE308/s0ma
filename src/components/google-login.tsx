import { useRouter } from "expo-router";
import { Button } from "./ui";
import { BotaoGoogle } from "../screens/perfil-social";
export function GoogleLogin({ vincular = false }: { vincular?: boolean }) {
  const r = useRouter();
  return vincular ? (
    <Button
      secondary
      title="Configurar vinculação e privacidade"
      onPress={() => r.push("/personalizar-perfil")}
    />
  ) : (
    <BotaoGoogle />
  );
}
