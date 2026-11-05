import dados from "./indicadores-sociais.json";
export const indicadoresSociais = dados;
export const indicadorDaUF = (uf: string) =>
  dados.regioes.find((r) => r.ufs.includes(uf));
export const percentualSocial = (valor: number) =>
  valor.toFixed(1).replace(".", ",") + "%";
export const nivelSocial = (nome: string) => {
  const valor = dados.regioes.find((r) => r.nome === nome)?.pobreza;
  return valor === undefined
    ? 0
    : valor >= 38
      ? 4
      : valor >= 30
        ? 3
        : valor >= 15
          ? 2
          : 1;
};
export const legendaSocial = [
  "Sem indicador regional",
  "Menos de 15%",
  "15% a menos de 30%",
  "30% a menos de 38%",
  "38% ou mais",
];
