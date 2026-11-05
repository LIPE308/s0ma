const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tipoBanco } = require('../backend/tipo-banco');

test('MySQL é o padrão mesmo com DATABASE_URL antiga no ambiente', () => {
  assert.equal(tipoBanco({}), 'mysql');
  assert.equal(tipoBanco({ DATABASE_URL: 'postgres://legado.invalid/soma' }), 'mysql');
  assert.equal(tipoBanco({ BANCO_TIPO: 'mysql', DATABASE_URL: 'postgres://legado.invalid/soma' }), 'mysql');
});
test('compatibilidade PostgreSQL só é habilitada por escolha explícita', () => {
  assert.equal(tipoBanco({ BANCO_TIPO: 'postgres' }), 'postgres');
  assert.throws(() => tipoBanco({ BANCO_TIPO: 'invalido' }), /BANCO_TIPO/);
});
test('builds não apontam por padrão para a API antiga', () => {
  const { build } = require('../eas.json');
  for (const perfil of ['preview', 'production', 'grupo', 'local']) {
    assert.equal(build[perfil].env.EXPO_PUBLIC_URL_BACKEND, '');
  }
});
test('publicação assistida para antes do EAS enquanto a API MySQL não está configurada', () => {
  const { spawnSync } = require('node:child_process');
  const resultado = spawnSync(process.execPath, ['scripts/publicar-ota.js', 'preview', 'verificacao local sem publicar'], { encoding: 'utf8' });
  assert.equal(resultado.status, 1);
  assert.match(resultado.stderr, /Publicação bloqueada/);
});
