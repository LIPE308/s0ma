// Atualiza somente a redação dos quatro registros iniciais do projeto escolar.
const {existsSync}=require('node:fs');
const {join}=require('node:path');
if(existsSync(join(__dirname,'.env')))process.loadEnvFile(join(__dirname,'.env'));
async function main(){
  if(require('./tipo-banco').tipoBanco()!=='mysql'||!['localhost','127.0.0.1'].includes(process.env.MYSQL_HOST||'127.0.0.1'))throw Error('Atualização restrita ao MySQL local.');
  const {banco,transacao}=require('./banco');
  const historias=require('./historias-campanhas.json');
  try{
    await transacao(async q=>{
      for(const codigo of ['urgente-01','urgente-02','urgente-03','urgente-04']){
        const id='exemplo-'+codigo,h=historias[codigo];
        const [c]=await q('SELECT c.id FROM campanhas c JOIN usuarios u ON u.id=c.usuario_id WHERE c.id=? AND u.email=? FOR UPDATE',[id,'demonstracao@soma.example']);
        if(!c)throw Error('Registro inicial ausente ou com outro responsável: '+id);
        await q('UPDATE campanhas SET titulo=?,descricao=?,categoria=? WHERE id=?',[h.titulo,h.historia,h.categoria,id]);
      }
    });
    console.log('Quatro histórias urgentes atualizadas. Metas, saldos e revisões preservados.');
  }finally{await banco.end();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
