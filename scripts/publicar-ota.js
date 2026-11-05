// Publicação assistida SOMENTE em teste. Não existe atalho de produção.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve, delimiter } = require('node:path');

function planoPublicacao(canal, mensagem) {
  if (!['preview', 'development'].includes(canal)) throw Error('Este comando só publica nos canais preview ou development. Produção exige autorização e procedimento manual documentado.');
  if (!mensagem || mensagem.startsWith('-') || mensagem.length > 200) throw Error('Informe uma descrição de até 200 caracteres, sem opções de CLI.');
  return ['update', '--channel', canal, '--environment', canal, '--platform', 'android', '--message', mensagem, '--non-interactive'];
}

function main() {
  const [canal, mensagem, ...extras] = process.argv.slice(2);
  if (extras.length) throw Error('Passe apenas uma mensagem entre aspas. Não são aceitas opções adicionais.');
  const args = planoPublicacao(canal, mensagem);
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' });
  if (status.status !== 0 || status.stdout.trim()) throw Error('Salve as mudanças rastreadas em um commit antes de publicar OTA.');
  // npm exec disponibiliza EAS no PATH. Invocar Node diretamente evita shell
  // e impede que caracteres da mensagem sejam interpretados como comandos.
  const cli = (process.env.PATH || '').split(delimiter)
    .map(bin => resolve(bin, '../eas-cli/bin/run')).find(p => existsSync(p));
  if (!cli) throw Error('Execute pelos comandos npm run ota:preview ou npm run ota:development.');
  const filho = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' });
  if (filho.error) throw Error('Não foi possível iniciar o EAS Update.');
  process.exitCode = filho.status ?? 1;
}
module.exports = { planoPublicacao };
if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
