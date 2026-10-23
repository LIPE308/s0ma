const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lerData, escreverData, diasDoMes } = require('../src/data/calendario.ts');
const { marcosDaEstrada, iconeDoObjetivo, indiceAtual } = require('../src/data/rota.ts');
test('calendário brasileiro valida dias, meses e anos bissextos sem normalizar datas inválidas', () => {
  assert.equal(lerData('31/04/2026'), null); assert.equal(lerData('29/02/2026'), null);
  assert.equal(lerData('01/13/2026'), null); assert.equal(lerData(''), null);
  assert.equal(escreverData(lerData('29/02/2028')), '29/02/2028');
  assert.equal(diasDoMes(2028, 1).filter(Boolean).length, 29);
  assert.equal(diasDoMes(2026, 9).filter(Boolean).length, 31);
  assert.equal(diasDoMes(2026, 9)[4], 1);
});
test('rota mantém cinco marcos financeiros e representa a finalidade verdadeira', () => {
  const originais = [0, 20000, 125000, 250000, 375000, 500000].map((valor, i) => ({ id: `financeiro-${i}`, titulo: `${i * 25}% da meta`, valor, concluido: valor <= 20000, data: null, icone: 'moedas' }));
  originais.splice(2, 0, { id: 'anuncios', titulo: 'Anúncios', valor: 0, concluido: false, data: null, icone: 'anuncio' });
  const m = marcosDaEstrada(originais, 'Meu PlayStation 5');
  assert.equal(m.length, 5); assert.equal(m[4].titulo, 'Meu PlayStation 5'); assert.equal(m[4].valor, 500000); assert.equal(m[4].icone, 'console');
  assert.equal(indiceAtual(m), 1); assert.equal(originais.length, 7);
  assert.equal(originais.find(x => x.id === 'anuncios').concluido, false);
  assert.equal(iconeDoObjetivo('Biblioteca para todos'), 'livro'); assert.equal(iconeDoObjetivo('Construir uma casa'), 'casa');
  assert.equal(indiceAtual(m.map(x => ({ ...x, concluido: true }))), 4);
});
