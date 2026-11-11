const {existsSync}=require('node:fs');const {join}=require('node:path');
if(existsSync(join(__dirname,'.env')))process.loadEnvFile(join(__dirname,'.env'));
async function main(){
 if(require('./tipo-banco').tipoBanco()!=='mysql'||!['127.0.0.1','localhost'].includes(process.env.MYSQL_HOST||'127.0.0.1'))throw Error('Operação restrita ao MySQL local.');
 const {banco,transacao}=require('./banco');const {auditar}=require('./soma2');
 try{const total=await transacao(async q=>{
  const [admin]=await q('SELECT u.id FROM usuarios u JOIN administradores_locais a ON a.usuario_id=u.id WHERE u.administrador=1 AND u.bloqueado=0 ORDER BY u.id LIMIT 1');
  if(!admin)throw Error('Administrador local não encontrado.');
  const lista=await q("SELECT c.id FROM campanhas c JOIN campanhas_detalhes d ON d.campanha_id=c.id JOIN perfis p ON p.usuario_id=c.usuario_id JOIN usuarios u ON u.id=c.usuario_id WHERE c.estado='rascunho' AND d.submetida=1 AND c.estado_antes_moderacao IS NULL AND p.adulto=1 AND u.bloqueado=0 FOR UPDATE");
  for(const c of lista){await q("UPDATE campanhas SET estado='ativa' WHERE id=?",[c.id]);await auditar(q,admin.id,c.id,'publicada_regular_apos_envio',{regra:'Publicação regular autorizada pelo operador; urgência não concedida'});}
  return lista.length;
 });console.log(total+' campanhas já enviadas publicadas; rascunhos privados e moderação preservados.');}finally{await banco.end();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});