import { useEffect, useState } from "react";
import { Button, Copy, Heading, Screen } from "../src/components/ui";
import { diagnosticoAtualizacoes } from "../src/servicos/atualizacoes";

export default function AtualizacoesApp() {
  const [diagnostico, definirDiagnostico] = useState<Awaited<ReturnType<typeof diagnosticoAtualizacoes>>>();
  async function lerDiagnostico() {
    definirDiagnostico(await diagnosticoAtualizacoes());
  }
  useEffect(() => { void lerDiagnostico(); }, []);
  return (
    <Screen title="Atualizações do app" heading="Melhorias sem interromper você.">
      <Copy>
        Atualizações compatíveis são baixadas enquanto você usa o SOMA.
        Elas entram em uso na próxima inicialização completa, depois de fechar
        e abrir o aplicativo. Voltar de outro app não reinicia sua sessão.
      </Copy>
      {diagnostico ? <>
        <Copy>OTA: {diagnostico.habilitado ? "habilitado" : "indisponível neste ambiente"}</Copy>
        <Copy>Versão de conteúdo: {diagnostico.versao}</Copy>
        <Copy>Canal: {diagnostico.canal || "não configurado"}</Copy>
        <Copy>Runtime: {diagnostico.runtime || "não configurado"}</Copy>
        <Copy>Origem: {diagnostico.origem}</Copy>
        <Copy>Update: {diagnostico.updateId || "nenhum"}</Copy>
        {diagnostico.recuperacaoEmergencial ? <Copy>O aplicativo iniciou com recuperação de segurança.</Copy> : null}
        <Heading>Diagnóstico local</Heading>
        <Copy muted>Registros técnicos ficam neste dispositivo, sem dados da sua conta.</Copy>
        {diagnostico.registros.slice(-8).map((item, i) => (
          <Copy key={i} muted>{item.horario} · {item.evento}</Copy>
        ))}
        {diagnostico.codigosNativos.map((item, i) => (
          <Copy key={"nativo-" + i} muted>{item.codigo} · {item.nivel}</Copy>
        ))}
      </> : <Copy>Carregando diagnóstico…</Copy>}
      <Button secondary title="Atualizar diagnóstico" onPress={() => { void lerDiagnostico(); }} />
    </Screen>
  );
}
