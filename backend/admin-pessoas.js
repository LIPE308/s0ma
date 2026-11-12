const {erro}=require('./auxiliares');
async function atenderPessoas(ctx){
 const {caminho,metodo,dados,consultar,transacao,usuario}=ctx;
 const match=caminho.match(/^\/api\/administracao\/painel\/pessoas(?:\/(\d+))?$/);
 if(!match)return null;
 const id=Number(match[1]);
 const ok=resultado=>({resultado});
 if(id&&metodo==='GET'){
  const [p]=await consultar('SELECT id,nome,email,telefone,regiao,administrador,bloqueado FROM usuarios WHERE id=?',[id]);
  if(!p)erro('Pessoa não encontrada.',404);
  const campanhas=await consultar('SELECT id,titulo,estado,categoria,regiao,criada_em FROM campanhas WHERE usuario_id=? ORDER BY criada_em DESC',[id]);
  const [atividade]=await consultar('SELECT (SELECT COUNT(*) FROM ajudas WHERE usuario_id=?) AS ajudas,(SELECT COUNT(*) FROM pagamentos WHERE usuario_id=?) AS doacoes',[id,id]);
  return ok({...p,campanhas,atividade});
 }
 erro('Os cadastros são somente para consulta no painel administrativo.',403);
}
module.exports={atenderPessoas};
