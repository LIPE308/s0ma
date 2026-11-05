import catalogo from "../data/municipios-brasil.json";
export type Municipio = { id: number; nome: string; uf: string };
export const municipiosBrasil: Municipio[] = catalogo;
export const normalizarCidade = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export const nomeMunicipio = (m: Municipio) => `${m.nome}, ${m.uf}`;
const indice = municipiosBrasil.map((m) => ({
  municipio: m,
  nome: normalizarCidade(m.nome),
  busca: normalizarCidade(nomeMunicipio(m)),
}));
export function buscarMunicipios(texto: string, uf = "", limite = 8) {
  const query = normalizarCidade(texto);
  if (query.length < 2) return [];
  const termos = query.split(" ");
  return indice
    .filter(
      (m) =>
        (!uf || m.municipio.uf === uf) &&
        termos.every((t) => m.busca.includes(t)),
    )
    .sort(
      (a, b) =>
        Number(b.nome.startsWith(query)) - Number(a.nome.startsWith(query)) ||
        a.municipio.nome.localeCompare(b.municipio.nome, "pt-BR") ||
        a.municipio.uf.localeCompare(b.municipio.uf),
    )
    .slice(0, Math.max(0, limite))
    .map((m) => m.municipio);
}
export function localizarMunicipio(texto: string, uf = "") {
  const nome = normalizarCidade(texto);
  return (
    indice.find((m) => (!uf || m.municipio.uf === uf) && m.busca === nome)
      ?.municipio ||
    indice.find((m) => m.municipio.uf === uf && m.nome === nome)?.municipio
  );
}
