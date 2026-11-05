export type TerritorioMunicipal = {
  id: number;
  nome: string;
  caminho: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
};
export type MalhaMunicipal = { uf: string; municipios: TerritorioMunicipal[] };
export function carregarMalha(uf: string): MalhaMunicipal | null {
  switch (uf) {
    case "AC":
      return require("./malhas-municipais/AC.json");
    case "AL":
      return require("./malhas-municipais/AL.json");
    case "AM":
      return require("./malhas-municipais/AM.json");
    case "AP":
      return require("./malhas-municipais/AP.json");
    case "BA":
      return require("./malhas-municipais/BA.json");
    case "CE":
      return require("./malhas-municipais/CE.json");
    case "DF":
      return require("./malhas-municipais/DF.json");
    case "ES":
      return require("./malhas-municipais/ES.json");
    case "GO":
      return require("./malhas-municipais/GO.json");
    case "MA":
      return require("./malhas-municipais/MA.json");
    case "MG":
      return require("./malhas-municipais/MG.json");
    case "MS":
      return require("./malhas-municipais/MS.json");
    case "MT":
      return require("./malhas-municipais/MT.json");
    case "PA":
      return require("./malhas-municipais/PA.json");
    case "PB":
      return require("./malhas-municipais/PB.json");
    case "PE":
      return require("./malhas-municipais/PE.json");
    case "PI":
      return require("./malhas-municipais/PI.json");
    case "PR":
      return require("./malhas-municipais/PR.json");
    case "RJ":
      return require("./malhas-municipais/RJ.json");
    case "RN":
      return require("./malhas-municipais/RN.json");
    case "RO":
      return require("./malhas-municipais/RO.json");
    case "RR":
      return require("./malhas-municipais/RR.json");
    case "RS":
      return require("./malhas-municipais/RS.json");
    case "SC":
      return require("./malhas-municipais/SC.json");
    case "SE":
      return require("./malhas-municipais/SE.json");
    case "SP":
      return require("./malhas-municipais/SP.json");
    case "TO":
      return require("./malhas-municipais/TO.json");
    default:
      return null;
  }
}
