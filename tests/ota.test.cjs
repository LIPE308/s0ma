const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { criarVerificacaoOTA } = require('../src/servicos/atualizacoes-core.ts');
const { planoPublicacao } = require('../scripts/publicar-ota');

function ambiente(opcoes = {}) {
  const eventos = [];
  let verificacoes = 0, downloads = 0, reinicios = 0;
  const iniciar = criarVerificacaoOTA({
    habilitado: true,
    verificar: async () => { verificacoes++; return { isAvailable: true, isRollBackToEmbedded: false }; },
    baixar: async () => { downloads++; return { isNew: true, isRollBackToEmbedded: false }; },
    registrar: e => eventos.push(e),
    reiniciar: () => reinicios++,
    ...opcoes,
  });
  return { iniciar, eventos, totais: () => ({ verificacoes, downloads, reinicios }) };
}

test('download concorrente é único e não reinicia nem aplica a atualização durante o uso', async () => {
  const a = ambiente();
  await Promise.all([a.iniciar(), a.iniciar(), a.iniciar()]);
  assert.deepEqual(a.totais(), { verificacoes: 1, downloads: 1, reinicios: 0 });
  assert.equal(a.eventos.at(-1), 'pronta_na_proxima_abertura');
  for (const arquivo of ['src/servicos/atualizacoes.ts', 'src/servicos/atualizacoes-core.ts', 'app/_layout.tsx', 'app/atualizacoes-app.tsx']) {
    assert.doesNotMatch(readFileSync(arquivo, 'utf8'), /reloadAsync|reloadAppAsync|AppState\.addEventListener/);
  }
});
test('web, Expo Go e debug não consultam o servidor OTA', async () => {
  const a = ambiente({ habilitado: false });
  await a.iniciar();
  assert.deepEqual(a.totais(), { verificacoes: 0, downloads: 0, reinicios: 0 });
});
test('sem atualização não baixa nem modifica a aplicação em execução', async () => {
  const a = ambiente({ verificar: async () => ({ isAvailable: false, isRollBackToEmbedded: false }) });
  await a.iniciar();
  assert.equal(a.totais().downloads, 0);
  assert.equal(a.eventos.at(-1), 'sem_atualizacao');
});
test('offline não impede abertura nem repete requisições na mesma sessão; próxima abertura tenta novamente', async () => {
  const opcoes = { verificar: async () => { throw Error('offline'); } };
  const a = ambiente(opcoes);
  await assert.doesNotReject(Promise.all([a.iniciar(), a.iniciar()]));
  assert.equal(a.eventos.filter(e => e === 'verificando').length, 1);
  assert.equal(a.eventos.at(-1), 'falha_verificacao');
  const novaAbertura = ambiente(opcoes);
  await novaAbertura.iniciar();
  assert.equal(novaAbertura.eventos.at(-1), 'falha_verificacao');
});
test('download interrompido nunca é anunciado como pronto', async () => {
  const a = ambiente({ baixar: async () => { throw Error('rede interrompida'); } });
  await assert.doesNotReject(a.iniciar());
  assert.equal(a.eventos.at(-1), 'falha_download');
  assert.ok(!a.eventos.includes('pronta_na_proxima_abertura'));
});
test('diretiva de rollback para o bundle embarcado também é baixada sem reiniciar', async () => {
  const a = ambiente({
    verificar: async () => ({ isAvailable: false, isRollBackToEmbedded: true }),
    baixar: async () => ({ isNew: false, isRollBackToEmbedded: true }),
  });
  await a.iniciar();
  assert.equal(a.eventos.at(-1), 'recuperacao_preparada');
  assert.equal(a.totais().reinicios, 0);
});
test('configuração protege runtimes, recuperação, canais e a versão embarcada', () => {
  const app = require('../app.json').expo, eas = require('../eas.json');
  assert.deepEqual(app.runtimeVersion, { policy: 'fingerprint' });
  assert.equal(app.updates.disableAntiBrickingMeasures, false);
  assert.equal(app.updates.useEmbeddedUpdate, true);
  assert.equal(app.updates.checkAutomatically, 'ON_ERROR_RECOVERY');
  assert.equal(app.updates.fallbackToCacheTimeout, 0);
  assert.equal(app.updates.url, 'https://u.expo.dev/' + app.extra.eas.projectId);
  for (const perfil of ['development', 'preview', 'production']) assert.equal(eas.build[perfil].channel, perfil);
  assert.equal(eas.build.grupo.channel, 'production');
  assert.equal(eas.build.preview.env.EXPO_PUBLIC_URL_BACKEND, eas.build.grupo.env.EXPO_PUBLIC_URL_BACKEND);
  const configurar = require('../app.config');
  const anterior = process.env.EAS_BUILD_PROFILE;
  try {
    process.env.EAS_BUILD_PROFILE = undefined;
    const c = configurar({ config: app });
    assert.equal(c.plugins.find(p => Array.isArray(p) && p[0] === 'expo-build-properties')[1].android.usesCleartextTraffic, false);
  } finally {
    if (anterior === undefined) delete process.env.EAS_BUILD_PROFILE; else process.env.EAS_BUILD_PROFILE = anterior;
  }
});
test('publicação assistida recusa produção, opções extras e mensagens vazias', () => {
  for (const canal of ['production', 'main', '--channel']) assert.throws(() => planoPublicacao(canal, 'teste'));
  for (const mensagem of ['', undefined, '--channel production']) assert.throws(() => planoPublicacao('preview', mensagem));
  const args = planoPublicacao('preview', 'teste & conteúdo');
  assert.equal(args[args.indexOf('--message') + 1], 'teste & conteúdo');
  assert.equal(args[args.indexOf('--channel') + 1], 'preview');
});
