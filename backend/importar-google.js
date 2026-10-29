// Importa o JSON do cliente Web baixado no Google Cloud sem imprimir o segredo.
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve,join } = require('node:path');
function importar(arquivo, destino=join(__dirname,'.env')) {
  if (!arquivo) throw new Error('Use npm run google:importar -- caminho-do-json-baixado-no-Google-Cloud.');
  const web = JSON.parse(readFileSync(resolve(arquivo),'utf8')).web;
  if (!web?.client_id || !web?.client_secret) throw new Error('Escolha um cliente OAuth do tipo Aplicativo Web.');
  const retorno = (web.redirect_uris||[]).find(u=>u==='http://localhost:3001/api/auth/google/callback');
  if (!retorno) throw new Error('Cadastre http://localhost:3001/api/auth/google/callback nos redirecionamentos autorizados antes de importar.');
  let conteudo = existsSync(destino)?readFileSync(destino,'utf8'):'';
  for (const [chave,valor] of Object.entries({GOOGLE_CLIENT_ID:web.client_id,GOOGLE_CLIENT_SECRET:web.client_secret,GOOGLE_REDIRECT_URI:retorno})) {
    if (typeof valor!=='string' || /[\r\n\0]/.test(valor)) throw new Error('Credencial inválida.');
    const linha=chave+'='+JSON.stringify(valor), padrao=new RegExp('^'+chave+'=.*$','m');
    conteudo=padrao.test(conteudo)?conteudo.replace(padrao,()=>linha):conteudo.replace(/\s*$/,'')+'\n'+linha+'\n';
  }
  writeFileSync(destino,conteudo,{mode:0o600});
}
if (require.main===module) { try { importar(process.argv[2]); console.log('OAuth Web importado em backend/.env. Reinicie o servidor e teste o login. Nenhuma credencial foi enviada ao Git.'); } catch(e) { console.error(e.message);process.exitCode=1; } }
module.exports={importar};
