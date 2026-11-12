import { EntryMotion } from "../design/motion";
import { useState } from "react";
import { View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Copy, Notice, Screen, useTheme } from "../components/ui";
import { TutorialIlustracao } from "../components/tutorial-ilustracao";
import { useSessao } from "../servicos/api";
const passos = [
  {
    titulo: "Encontre uma causa que toque você.",
    texto:
      "Na aba Causas, conheça as histórias e as necessidades de cada campanha. As urgentes aparecem primeiro, com o selo vermelho. Abra uma para ver como ajudar.",
  },
  {
    titulo: "Ajude do seu jeito.",
    texto:
      "Você pode doar, oferecer seu tempo nas ações disponíveis ou compartilhar. Confira a meta, as necessidades e os detalhes antes de confirmar sua ajuda.",
  },
  {
    titulo: "Dê voz à sua história.",
    texto:
      "Em Criar, conte a situação, adicione fotos, informe a meta e escolha sua cidade. Revise e publique em Causas. Pedidos de urgência dependem de avaliação da equipe.",
  },
  {
    titulo: "Nosso diferencial: anúncios que apoiam urgências.",
    texto:
      "Além das doações, o modelo do SOMA destina 70% da receita líquida publicitária confirmada ao fundo solidário. Ele apoia campanhas urgentes elegíveis, com revisão vigente. Compartilhar amplia o alcance do app, mas não garante um valor por acesso.",
  },
  {
    titulo: "Veja a ajuda chegar mais longe.",
    texto:
      "Acompanhe suas campanhas e contribuições no Perfil e na Atividade. No mapa, explore cidades e encontre causas com localização autorizada. Na Rota Inteligente, diferencie o saldo registrado das projeções.",
  },
];
export function Tutorial() {
  const { etapa: inicial } = useLocalSearchParams<{ etapa?: string }>();
  const [etapa, setEtapa] = useState(inicial === "anuncios" ? 3 : 0);
  const r = useRouter(),
    p = useSessao();
  const { colors } = useTheme();
  const passo = passos[etapa];
  function fechar() {
    if (r.canGoBack()) r.back();
    else r.replace(p ? "/" : "/entrar");
  }
  return (
    <Screen
      title="Conheça o SOMA"
      heading={passo.titulo}
      subtitle={"Passo " + (etapa + 1) + " de " + passos.length}
      onBack={fechar}
      variant="form"
    >
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
        {passos.map((v, i) => (
          <Pressable
            key={v.titulo}
            accessibilityRole="button"
            accessibilityLabel={"Ir para passo " + (i + 1) + ": " + v.titulo}
            accessibilityState={{ selected: i === etapa }}
            onPress={() => setEtapa(i)}
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
          >
            <View
              style={{
                height: 5,
                borderRadius: 99,
                backgroundColor: i === etapa ? colors.primary : colors.line,
              }}
            />
          </Pressable>
        ))}
      </View>
      <EntryMotion key={etapa} style={{ gap: 16 }}>
        <TutorialIlustracao etapa={etapa} />
        <View accessibilityLiveRegion="polite">
          <Copy>{passo.texto}</Copy>
        </View>
        {etapa === 3 ? (
          <Notice>
            Projeções não
            são receita confirmada; a renda real depende da integração e da
            conciliação do provedor.
          </Notice>
        ) : null}
      </EntryMotion>
      <Button
        title={etapa === 4 ? "Entendi, vamos começar" : "Próximo passo"}
        onPress={() =>
          etapa === 4
            ? fechar()
            : setEtapa((e) => Math.min(passos.length - 1, e + 1))
        }
      />
      {etapa > 0 ? (
        <Button
          secondary
          title="Passo anterior"
          onPress={() => setEtapa((e) => Math.max(0, e - 1))}
        />
      ) : null}
      <Button secondary title="Fechar tutorial" onPress={fechar} />
    </Screen>
  );
}
