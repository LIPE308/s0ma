// Sem dependências nativas: as regras podem ser verificadas em testes Node.
export type EventoOTA =
  | "inicializado" | "desativado" | "verificando" | "sem_atualizacao"
  | "baixando" | "pronta_na_proxima_abertura" | "recuperacao_preparada"
  | "falha_verificacao" | "falha_download";

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
