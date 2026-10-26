const { erro, texto, usuarioPublico } = require('./auxiliares');
const { tokenDaRequisicao,gravarCookieSessao }=require('./sessao-web');
async function migrarExperiencia(consultar,banco,transacao) {
  const[meio]=await consultar("SHOW COLUMNS FROM pagamentos LIKE 'meio'");
  if(!meio.Type.includes('Simulação'))await banco.query("ALTER TABLE pagamentos MODIFY meio ENUM('Pix','Crédito','Débito','Simulação') NOT NULL");
  const colunas=await consultar('SHOW COLUMNS FROM perfis');
  for(const [nome,tipo] of Object.entries({onboarding_concluido:'BOOLEAN NOT NULL DEFAULT FALSE',foto_google:'VARCHAR(600)',usar_foto_google:'BOOLEAN NOT NULL DEFAULT FALSE'})) if(!colunas.some(c=>c.Field===nome)) await banco.query('ALTER TABLE perfis ADD COLUMN '+nome+' '+tipo);
  await banco.query("CREATE TABLE IF NOT EXISTS compartilhamentos (id VARCHAR(100) PRIMARY KEY,usuario_id INT NOT NULL,campanha_id VARCHAR(36) NOT NULL,canal ENUM('link','nativo') NOT NULL,criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (usuario_id) REFERENCES usuarios(id),FOREIGN KEY (campanha_id) REFERENCES campanhas(id))");
  await transacao(async q=>{
    await q("SELECT chave FROM soma_migracoes WHERE chave='002-lancamentos-em-andamento' FOR UPDATE");
    if((await q("SELECT chave FROM soma_migracoes WHERE chave='004-experiencia-humana'"))[0]) return;
    await q('UPDATE perfis SET onboarding_concluido=1');
    await q("INSERT INTO soma_migracoes (chave) VALUES ('004-experiencia-humana')");
  });
}
async function atenderExperiencia(ctx) {
  const {caminho,metodo,usuario,dados,consultar,transacao,obterCampanha,exigirLogin,conferirVisibilidade}=ctx;
  if(caminho==='/api/sessao'&&metodo==='GET') {
    exigirLogin(usuario);const[p]=await consultar('SELECT onboarding_concluido FROM perfis WHERE usuario_id=?',[usuario.id]);
    if(ctx.requisicao.headers.authorization)gravarCookieSessao(ctx.requisicao,ctx.resposta,tokenDaRequisicao(ctx.requisicao));
    return {resultado:{...usuarioPublico(usuario),perfil_completo:Boolean(p?.onboarding_concluido)}};
  }
  if(caminho==='/api/perfil/completar'&&metodo==='PUT') {
    exigirLogin(usuario);const nome=texto(dados.nome,'seu nome',150),regiao=texto(dados.regiao||'','a cidade',150,false);
    await transacao(async q=>{
      if(dados.avatar_id){const[a]=await q("SELECT id FROM arquivos WHERE id=? AND usuario_id=? AND finalidade='avatar'",[dados.avatar_id,usuario.id]);if(!a)erro('Escolha uma foto do seu próprio perfil.',403);}
      await q('UPDATE usuarios SET nome=?,regiao=? WHERE id=?',[nome,regiao,usuario.id]);
      await q('INSERT INTO perfis (usuario_id,onboarding_concluido,usar_foto_google) VALUES (?,1,?) ON DUPLICATE KEY UPDATE onboarding_concluido=1,usar_foto_google=VALUES(usar_foto_google)',[usuario.id,Number(dados.usar_foto_google===true)]);
      if(dados.avatar_id!==undefined)await q('UPDATE perfis SET avatar_id=? WHERE usuario_id=?',[dados.avatar_id||null,usuario.id]);
    });
    const[p]=await consultar('SELECT * FROM usuarios WHERE id=?',[usuario.id]);return {resultado:usuarioPublico(p)};
  }
  const partes=caminho.match(/^\/api\/campanhas\/([^/]+)\/compartilhar$/);
  if(partes&&metodo==='POST') {
    exigirLogin(usuario);const c=await obterCampanha(partes[1]);conferirVisibilidade(c,usuario);
    if(!['ativa','encerrada'].includes(c.estado)) erro('Publique a campanha após revisão antes de compartilhar.',409);
    const id=texto(dados.id,'a identificação do compartilhamento',100);
    if(!['link','nativo'].includes(dados.canal)) erro('Forma de compartilhamento inválida.');
    await consultar('INSERT IGNORE INTO compartilhamentos (id,usuario_id,campanha_id,canal) VALUES (?,?,?,?)',[id,usuario.id,c.id,dados.canal]);
    return {resultado:{mensagem:'Link compartilhado. Isso não gera receita garantida.'}};
  }
  if(caminho==='/api/meus-compartilhamentos'&&metodo==='GET') {
    exigirLogin(usuario);return {resultado:await consultar("SELECT c.id,c.titulo,MAX(s.criado_em) AS compartilhado_em,COUNT(*) AS registros FROM compartilhamentos s JOIN campanhas c ON c.id=s.campanha_id WHERE s.usuario_id=? AND c.estado IN ('ativa','encerrada') GROUP BY c.id,c.titulo ORDER BY compartilhado_em DESC LIMIT 100",[usuario.id])};
  }
  return null;
}
function fotoGoogleSegura(valor) {
  if(typeof valor!=='string'||valor.length>600) return null;
  try{const u=new URL(valor);return u.protocol==='https:'&&(u.hostname==='googleusercontent.com'||u.hostname.endsWith('.googleusercontent.com'))?u.href:null;}catch{return null;}
}
module.exports={migrarExperiencia,atenderExperiencia,fotoGoogleSegura};
