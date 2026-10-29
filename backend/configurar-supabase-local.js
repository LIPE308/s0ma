// Configura somente o projeto compartilhado confirmado no painel do Supabase.
// Credenciais permanecem em arquivos locais ignorados pelo Git.
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const local = path.join(__dirname, '.env.supabase.local');
async function main() {
  if (!fs.existsSync(local)) throw Error('Preencha backend/.env.supabase.local primeiro.');
  process.loadEnvFile(local);
  const senha = process.env.SUPABASE_SENHA_BANCO;
  if (!senha) throw Error('Preencha SUPABASE_SENHA_BANCO no arquivo local. Não envie a senha pelo chat.');
  const url = new URL('postgresql://postgres.yahvoqitjxgrlndtaciu@aws-1-us-west-2.pooler.supabase.com:5432/postgres');
  url.password = senha;
  const cliente = new Client({connectionString:url.href,connectionTimeoutMillis:15000,ssl:{rejectUnauthorized:true,...(process.env.PGSSLROOTCERT?{ca:fs.readFileSync(process.env.PGSSLROOTCERT,'utf8')}:{})}});
  try {
    await cliente.connect();
    const marcador = await cliente.query("SELECT chave FROM soma_migracoes WHERE chave='005-supabase'");
    if (!marcador.rows.length) throw Error('O banco não tem a instalação SOMA esperada; nenhuma configuração foi trocada.');
    await cliente.query(fs.readFileSync(path.join(__dirname,'migracao-admin-postgres.sql'),'utf8'));
    const arquivo = path.join(__dirname,'.env');
    let texto=fs.existsSync(arquivo)?fs.readFileSync(arquivo,'utf8'):'';
    const valores={BANCO_TIPO:'postgres',DATABASE_URL:url.href};
    if(process.env.PGSSLROOTCERT)valores.PGSSLROOTCERT=process.env.PGSSLROOTCERT;
    for(const [chave,valor]of Object.entries(valores)) {
      const linha=chave+'='+JSON.stringify(valor);
      const padrao=new RegExp('^'+chave+'=.*$','m');
      texto=padrao.test(texto)?texto.replace(padrao,()=>linha):texto+'\n'+linha;
    }
    fs.writeFileSync(arquivo,texto+'\n');
    const contagens=await cliente.query('SELECT (SELECT COUNT(*) FROM usuarios)::int AS usuarios,(SELECT COUNT(*) FROM campanhas)::int AS campanhas');
    console.log(JSON.stringify({banco:'Supabase/PostgreSQL',projeto:'yahvoqitjxgrlndtaciu',configurado:true,...contagens.rows[0]}));
  } finally {await cliente.end();}
}
main().catch(e=>{const codigo=/^[A-Z0-9_]+$/.test(e.code||'')?e.code:'';console.error(codigo?'Conexão não concluída. Código: '+codigo:e.message.startsWith('Preencha')||e.message.startsWith('O banco')?e.message:'Conexão não concluída. Confira a senha do banco e o certificado local.');process.exitCode=1;});
