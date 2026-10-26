const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {spawn}=require('node:child_process');const {once}=require('node:events');const mysql=require('mysql2/promise');
const nome='soma_teste_compat_'+process.pid+'_'+Date.now();
const config={host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORTA||3306),user:process.env.MYSQL_TESTE_USUARIO||'root',password:process.env.MYSQL_TESTE_SENHA??'raiz_local_123'};
const env={...process.env,MYSQL_HOST:config.host,MYSQL_PORTA:String(config.port),MYSQL_USUARIO:config.user,MYSQL_SENHA:config.password,MYSQL_BANCO:nome,PORTA:'0',ENDERECO:'127.0.0.1',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',GOOGLE_REDIRECT_URI:''};
test('migração da main anterior conserva perfil, imagem, identidade e crédito publicitário uma única vez',{timeout:60000},async()=>{
 let db,server,url,erros='';
 async function iniciar(){server=spawn(process.execPath,['backend/servidor.js'],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(erros||'Servidor não iniciou')),20000);server.stderr.on('data',d=>erros+=d);server.stdout.on('data',d=>{const m=String(d).match(/porta (\d+)/);if(m){url='http://127.0.0.1:'+m[1]+'/api';clearTimeout(timer);resolve();}});server.once('exit',()=>{clearTimeout(timer);reject(Error(erros));});});}
 async function parar(){if(server&&server.exitCode===null){const fim=once(server,'exit');server.kill();await fim;}}
 try {
  db=await mysql.createConnection(config);await db.query('CREATE DATABASE '+nome+' CHARACTER SET utf8mb4');await db.query('USE '+nome);
  for(const f of ['backend/esquema.sql','backend/extensoes.sql'])for(const q of fs.readFileSync(f,'utf8').split(';').filter(q=>q.trim()))await db.query(q);
  await db.query("INSERT INTO usuarios (nome,email,senha_resumo,senha_sal) VALUES ('Legado fictício','legado@teste.example','resumo','sal')");
  const [[u]]=await db.query('SELECT id FROM usuarios');
  await db.query("INSERT INTO campanhas (id,usuario_id,titulo,descricao,categoria,regiao,prazo) VALUES ('compat',?,'Campanha anterior','Demonstração fictícia anterior','Educação','','')",[u.id]);
  await db.query("INSERT INTO necessidades (id,campanha_id,nome,tipo,meta,recebido) VALUES ('compat-meta','compat','Materiais','dinheiro',50000,10000)");
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=';
  await db.query("INSERT INTO perfis (usuario_id,tipo,biografia,foto) VALUES (?,'instituicao','Biografia anterior preservada',?)",[u.id,png]);
  await db.query("INSERT INTO imagens_campanha VALUES ('compat',?)",[png]);await db.query("INSERT INTO localizacoes_publicas VALUES ('compat','SC')");await db.query("INSERT INTO identidades_google VALUES ('sujeito-ficticio',?)",[u.id]);
  const [r]=await db.query("INSERT INTO receitas_solidarias (referencia,valor,autor_id,resultado) VALUES ('teste-anterior',10000,?,'{}')",[u.id]);await db.query("INSERT INTO distribuicoes_solidarias VALUES (?,'compat',2450)",[r.insertId]);
  await iniciar();
  let rota=await(await fetch(url+'/campanhas/compat/rota')).json();assert.equal(rota.confirmado,12450);assert.equal(rota.anuncios_creditados,2450);assert.equal(rota.saldo_legado,10000);
  const [[p]]=await db.query('SELECT * FROM perfis');assert.equal(p.biografia,'Biografia anterior preservada');assert.equal(p.publico,0);assert.equal(p.adulto,null);assert.ok(p.avatar_id);assert.equal(p.foto,png);
  const [[ident]]=await db.query("SELECT COUNT(*) AS total FROM identidades WHERE provedor='google'");assert.equal(ident.total,1);
  const [[local]]=await db.query("SELECT uf,mapa_autorizado,imagem_id FROM campanhas_detalhes WHERE campanha_id='compat'");assert.equal(local.uf,'SC');assert.equal(local.mapa_autorizado,1);assert.ok(local.imagem_id);
  const [[orig]]=await db.query('SELECT COUNT(*) AS total FROM receitas_solidarias');assert.equal(orig.total,1);
  const [[antes]]=await db.query('SELECT COUNT(*) AS total,SUM(valor) AS valor FROM lancamentos');await parar();await iniciar();
  const [[depois]]=await db.query('SELECT COUNT(*) AS total,SUM(valor) AS valor FROM lancamentos');assert.deepEqual(depois,antes);
  rota=await(await fetch(url+'/campanhas/compat/rota')).json();assert.equal(rota.confirmado,12450);assert.equal(rota.anuncios_creditados,2450);
 } finally {await parar();if(db){assert.match(nome,/^soma_teste_compat_\d+_\d+$/);await db.query('DROP DATABASE '+nome);await db.end();}}
});
