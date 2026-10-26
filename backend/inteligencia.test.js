const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classificarUrgencia, distribuirFundo, resumoFinanceiro, projetar } = require('./inteligencia');
const { prepararArquivo } = require('./midias');
test('urgência exige evidência e consistência, com prazo válido e pontuação explicável', () => {
  const criterios = { gravidade: 3, impacto: 3, documentos: true, consistente: true };
  const r = classificarUrgencia(criterios, '25/10/2026', new Date('2026-10-23T12:00:00Z'));
  assert.equal(r.categoria, 'Crítica'); assert.equal(r.pontos, 100);
  assert.equal(Object.values(r.regras).reduce((a, b) => a + b, 0), r.pontos);
  assert.equal(classificarUrgencia({ ...criterios, documentos: false }, '25/10/2026').categoria, 'Regular');
  assert.equal(classificarUrgencia({ ...criterios, consistente: false }, '25/10/2026').categoria, 'Regular');
  assert.equal(classificarUrgencia(criterios, '01/01/2020').regras.prazo, 0);
  assert.throws(() => classificarUrgencia({ ...criterios, gravidade: 4 }, '25/10/2026'));
});
test('rateio conserva centavos, respeita 70/30, teto e falta de elegíveis', () => {
  for (const receita of [1, 7, 99, 10000, 1000000]) {
    for (const quantidade of [0, 1, 2, 3, 20]) {
      const campanhas = Array.from({ length: quantidade }, (_, i) => ({ id: String(i), verificada: true, urgencia: 'Crítica', restante: 100000, recebidoAnterior: i * 5000, dias: i + 1, pontos: 90 }));
      const r = distribuirFundo(receita, campanhas);
      const total = r.distribuicoes.reduce((s, d) => s + d.valor, 0);
      assert.equal(r.fundo + r.manutencao, receita); assert.equal(total + r.retido, r.fundo);
      assert.ok(r.distribuicoes.every(d => Number.isInteger(d.valor) && d.valor <= Math.floor(r.fundo * .35) && d.valor <= 100000));
    }
  }
  assert.equal(distribuirFundo(10000, [{ id: 'x', verificada: false, urgencia: 'Crítica', restante: 100000, dias: 1, pontos: 100 }]).retido, 7000);
});
test('projeções não alteram confirmação e rejeitam hipóteses inválidas', () => {
  const r = resumoFinanceiro(500000, 20000, 0, 0);
  assert.equal(r.restante, 480000); assert.equal(r.percentual, 4);
  const p = projetar(20000, 1, 1000, 1);
  assert.equal(p.rendimento_estimado, 200); assert.equal(p.anuncios_estimados, 1000);
  assert.equal(r.arrecadado, 20000); assert.throws(() => projetar(20000, NaN, 0, 1)); assert.throws(() => projetar(20000, 3, 0, 1));
  assert.equal(resumoFinanceiro(0, 0).percentual, 0);
});
test('validação integrada aceita PNG e rejeita conteúdo ativo, disfarces e excesso', () => {
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=';
  assert.equal(prepararArquivo(png,'campanha').mime,'image/png');
  for(const texto of ['<svg onload=alert(1)>','https://example.org/rastrear.png','<html>foto falsa</html>']) assert.throws(()=>prepararArquivo(Buffer.from(texto).toString('base64'),'campanha'));
  assert.throws(()=>prepararArquivo(Buffer.alloc(2*1024*1024+1).toString('base64'),'campanha'));
});
