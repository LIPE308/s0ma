// Só inicia o APK compartilhável depois de confirmar a API remota e o PostgreSQL.
const { spawn } = require('node:child_process');
async function main() {
  const base = new URL(process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost');
  if (base.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(base.hostname) || base.hostname.endsWith('.supabase.co')) throw Error('Configure a URL HTTPS pública da API Node em EXPO_PUBLIC_URL_BACKEND.');
  if (base.username || base.password || base.search || base.hash) throw Error('A URL pública da API não deve conter credenciais ou tokens.');
  const resposta = await fetch(base.href.replace(/\/$/,'') + '/saude', { signal: AbortSignal.timeout(90000) });
  if (!resposta.ok) throw Error('A API não respondeu à verificação de saúde.');
  const saude = await resposta.json();
  if (saude.banco !== 'Supabase/PostgreSQL') throw Error('A API ainda não confirmou conexão com Supabase/PostgreSQL.');
  console.log('API HTTPS e Supabase confirmados. Iniciando APK do grupo.');
  const args = ['--yes','eas-cli','build','--platform','android','--profile','grupo'];
  const filho = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, EAS_BUILD_PROFILE: 'grupo' } });
  filho.once('error', () => { console.error('Não foi possível iniciar o EAS.'); process.exitCode=1; });
  filho.once('exit', codigo => { process.exitCode=codigo || 0; });
}
main().catch(e => { console.error(e.message); process.exitCode=1; });
