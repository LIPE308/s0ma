// Sem dependências nativas: as regras podem ser verificadas em testes Node.
export type EventoOTA =
  | "inicializado" | "desativado" | "verificando" | "sem_atualizacao"
  | "baixando" | "pronta_na_proxima_abertura" | "recuperacao_preparada"
  | "falha_verificacao" | "falha_download";

export type RegistroOTA = { horario: string; evento: EventoOTA };
const eventosPermitidos = new Set<EventoOTA>([
  "inicializado", "desativado", "verificando", "sem_atualizacao", "baixando",
  "pronta_na_proxima_abertura", "recuperacao_preparada", "falha_verificacao", "falha_download",
]);

export function lerRegistrosOTA(serializado: string | null): RegistroOTA[] {
  if (!serializado || serializado.length > 16000) return [];
  try {
    const dados: unknown = JSON.parse(serializado);
    if (!Array.isArray(dados)) return [];
    return dados.filter(item => item && typeof item === "object" &&
      eventosPermitidos.has(item.evento) && typeof item.horario === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.horario) &&
      Number.isFinite(Date.parse(item.horario)))
      .slice(-40).map(item => ({ horario: item.horario, evento: item.evento }));
  } catch { return []; }
}

type ProvedorOTA = {
  habilitado: boolean;
  verificar: () => Promise<{ isAvailable: boolean; isRollBackToEmbedded: boolean }>;
  baixar: () => Promise<{ isNew: boolean; isRollBackToEmbedded: boolean }>;
  registrar: (evento: EventoOTA) => void;
};

export function criarVerificacaoOTA(provedor: ProvedorOTA) {
  let abertura: Promise<void> | undefined;

  async function verificar() {
    // Nada nesta função navega, encerra sessões ou reinicia o JavaScript.
    provedor.registrar("inicializado");
    if (!provedor.habilitado) {
      provedor.registrar("desativado");
      return;
    }
    provedor.registrar("verificando");
    let disponivel;
    try {
      disponivel = await provedor.verificar();
    } catch {
      provedor.registrar("falha_verificacao");
      return; // Offline/servidor indisponível: mantém a versão funcional.
    }
    if (!disponivel.isAvailable && !disponivel.isRollBackToEmbedded) {
      provedor.registrar("sem_atualizacao");
      return;
    }
    provedor.registrar("baixando");
    try {
      const resultado = await provedor.baixar();
      if (resultado.isRollBackToEmbedded) {
        provedor.registrar("recuperacao_preparada");
      } else if (resultado.isNew) {
        provedor.registrar("pronta_na_proxima_abertura");
      } else {
        provedor.registrar("sem_atualizacao");
      }
    } catch {
      provedor.registrar("falha_download");
    }
  }

  return function verificarUmaVezNaAbertura() {
    // StrictMode, troca de tema ou remontagem não duplicam a mesma requisição.
    abertura ??= verificar();
    return abertura;
  };
}
