const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
// Transpila apenas este módulo de dados para exercitar a mesma busca usada na UI.
const ts = require("typescript");
const Module = require("node:module");
const filename = path.resolve(__dirname, "../src/servicos/municipios.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = module.paths;
mod._compile(compiled, filename);
const { buscarMunicipios, localizarMunicipio, municipiosBrasil } = mod.exports;

test("catálogo oficial cobre 27 UFs e 5.571 códigos únicos, incluindo novo município", () => {
  assert.equal(municipiosBrasil.length, 5571);
  assert.equal(new Set(municipiosBrasil.map((m) => m.id)).size, 5571);
  assert.equal(new Set(municipiosBrasil.map((m) => m.uf)).size, 27);
  assert.equal(localizarMunicipio("Boa Esperança do Norte", "MT").id, 5101837);
});
test("busca ignora acentos e caixa, permite UF e limita sugestões", () => {
  assert.ok(
    buscarMunicipios("SAO LUIS").some(
      (m) => m.nome === "São Luís" && m.uf === "MA",
    ),
  );
  assert.ok(buscarMunicipios("joao pessoa pb").some((m) => m.id === 2507507));
  assert.ok(buscarMunicipios("sao", "SP").every((m) => m.uf === "SP"));
  assert.equal(buscarMunicipios("s").length, 0);
  assert.ok(buscarMunicipios("sao").length <= 8);
  assert.equal(buscarMunicipios("cidade inexistente zzz").length, 0);
});
test("homônimos exigem UF, e nomes canônicos resolvem sem ambiguidade", () => {
  assert.equal(localizarMunicipio("Bom Jesus"), undefined);
  assert.notEqual(
    localizarMunicipio("Bom Jesus", "PI").id,
    localizarMunicipio("Bom Jesus", "RN").id,
  );
  assert.equal(localizarMunicipio("Petrolina, PE").id, 2611101);
  assert.equal(localizarMunicipio("Petrolina", "MA"), undefined);
});
test("malhas correspondem ao catálogo e documentam a única ausência de contorno", () => {
  const fonte = require("../src/data/malhas-municipais/fonte.json");
  const ids = new Set();
  for (const uf of new Set(municipiosBrasil.map((m) => m.uf))) {
    const malha = require(`../src/data/malhas-municipais/${uf}.json`);
    assert.equal(malha.uf, uf);
    for (const m of malha.municipios) {
      assert.ok(!ids.has(m.id));
      ids.add(m.id);
      assert.ok(municipiosBrasil.some((c) => c.id === m.id && c.uf === uf));
      assert.match(m.caminho, /^M/);
      assert.ok(m.largura > 0 && m.altura > 0);
      assert.ok(Number.isFinite(m.x) && Number.isFinite(m.y));
    }
  }
  assert.equal(ids.size, 5570);
  assert.deepEqual(
    municipiosBrasil.filter((m) => !ids.has(m.id)),
    fonte.semMalha,
  );
});
