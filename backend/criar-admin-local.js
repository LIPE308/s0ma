// Provisionamento explícito pelo operador local. Não é uma rota pública.
const { existsSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');
const { gerarSenha } = require('./auxiliares');
const env = join(__dirname,'.env'); if (existsSync(env)) process.loadEnvFile(env);
const { inicializarBanco, transacao, banco } = require('./banco');
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Use npm run admin:local -- email-da-conta.');
  const local = join(__dirname,'.admin-local.json');
  // Idempotente: não troca a senha a cada execução nem a publica na saída.
  if (existsSync(local)) {
    const anterior = JSON.parse(readFileSync(local,'utf8'));
    if (anterior.email === email) { console.log('Acesso já preparado. Consulte backend/.admin-local.json, que não entra no Git.'); return; }
    throw new Error('Já existe um acesso local preparado. Use admin:configurar para outra conta.');
  }
  await inicializarBanco();
  const senha = randomBytes(24).toString('base64url'), hash = gerarSenha(senha);
  await transacao(async q => {
    const [existente] = await q('SELECT id FROM usuarios WHERE email=? FOR UPDATE',[email]);
    let id = existente?.id;
    if (id && email !== 'admin@exemplo.com') throw new Error('A conta já existe. Use admin:configurar para manter a senha atual.');
    if (id) await q('UPDATE usuarios SET senha_resumo=?,senha_sal=?,administrador=1,bloqueado=0 WHERE id=?',[hash.resumo,hash.sal,id]);
    else { const r=await q('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal,administrador) VALUES (?,?,?,?,1)',['Administração SOMA',email,hash.resumo,hash.sal]); id=r.insertId; }
    await q('INSERT INTO administradores_locais (usuario_id) VALUES (?)',[id]);
    await q('INSERT INTO perfis (usuario_id,onboarding_concluido) VALUES (?,1) ON DUPLICATE KEY UPDATE onboarding_concluido=1',[id]);
    await q('DELETE FROM sessoes WHERE usuario_id=?',[id]);
  });
  writeFileSync(local,JSON.stringify({email,senha,endereco:'http://localhost:3001/administracao',observacao:'Credencial local privada. Não compartilhar nem enviar ao Git.'},null,2),{flag:'wx',mode:0o600});
  console.log('Administrador local criado com senha aleatória. Credencial salva somente em backend/.admin-local.json.');
}
main().catch(e=>{console.error(e.code?'Não foi possível provisionar o administrador. Confira o banco local.':e.message);process.exitCode=1;}).finally(()=>banco.end());
