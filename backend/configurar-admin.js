// Local operator command only. Public registration never accepts administrator privileges.
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const arquivo = join(__dirname, '.env');
if (existsSync(arquivo)) process.loadEnvFile(arquivo);
const { banco, transacao, inicializarBanco } = require('./banco');

async function configurar() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === 'admin@exemplo.com') throw new Error('Informe o e-mail da sua própria conta cadastrada: npm run admin:configurar -- seu-email. A conta antiga de exemplo não pode ser promovida.');
  await inicializarBanco();
  await transacao(async consulta => {
    const [pessoa] = await consulta('SELECT id FROM usuarios WHERE email=? FOR UPDATE', [email]);
    if (!pessoa) throw new Error('Conta não encontrada. Cadastre-a primeiro no aplicativo e execute o comando novamente.');
    await consulta('UPDATE usuarios SET administrador=1 WHERE id=?', [pessoa.id]);
    // Privilege changes require a new login, with a new session token.
    await consulta('DELETE FROM sessoes WHERE usuario_id=?', [pessoa.id]);
  });
  console.log('Administrador configurado. Entre novamente no aplicativo com a senha que você cadastrou.');
}
configurar().catch(problema => { console.error(problema.code ? 'Não foi possível configurar. Confira o MySQL e backend/.env.' : problema.message); process.exitCode = 1; }).finally(() => banco.end());
