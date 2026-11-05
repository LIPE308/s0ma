import type { Campanha } from "./api";
export const campanhaExemplo = (c: Campanha) => c.id.startsWith("exemplo-");
export const emergenciaExemplo = (c: Campanha) =>
  c.id.startsWith("exemplo-urgente-");
export const prioridadeCampanha = (c: Campanha) =>
  c.urgencia?.revisada && c.urgencia.classe === "critica"
    ? 3
    : emergenciaExemplo(c)
      ? 2
      : c.urgencia?.revisada
        ? 1
        : 0;
export const ordenarPrioridade = (lista: Campanha[]) =>
  [...lista].sort((a, b) => prioridadeCampanha(b) - prioridadeCampanha(a));

// O apoio publicitário é reservado às emergentes ativas; exemplos só geram projeções locais.
export const permiteAnuncios = (c: Campanha) =>
  c.estado === "ativa" &&
  (emergenciaExemplo(c) ||
    Boolean(c.urgencia?.revisada && c.urgencia.classe === "critica"));
