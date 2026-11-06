const {erro,texto,gerarSenha}=require('./auxiliares');
const {auditar}=require('./soma2');
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
 if((!id&&metodo==='POST')||(id&&metodo==='PUT')){
  const nome=texto(dados.nome,'o nome',150),email=texto(dados.email,'o e-mail',150).toLowerCase(),telefone=texto(dados.telefone||'','o telefone',30,false),regiao=texto(dados.regiao||'','a cidade',150,false);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))erro('Informe um e-mail válido.');
  if(!id&&(typeof dados.senha!=='string'||dados.senha.length<12||dados.senha.length>128))erro('A senha inicial deve ter entre 12 e 128 caracteres.');
  return ok(await transacao(async q=>{
   if(id){const [p]=await q('SELECT id,administrador FROM usuarios WHERE id=? FOR UPDATE',[id]);if(!p)erro('Pessoa não encontrada.',404);if(p.administrador)erro('O cadastro administrativo é gerenciado pelo operador local.',403);}
   const [existente]=await q('SELECT id FROM usuarios WHERE email=?',[email]);if(existente&&existente.id!==id)erro('Este e-mail já está cadastrado.',409);
   let criado=id;
   if(id)await q('UPDATE usuarios SET nome=?,email=?,telefone=?,regiao=? WHERE id=?',[nome,email,telefone,regiao,id]);
   else{const senha=gerarSenha(dados.senha);const r=await q('INSERT INTO usuarios (nome,email,telefone,regiao,senha_resumo,senha_sal) VALUES (?,?,?,?,?,?)',[nome,email,telefone,regiao,senha.resumo,senha.sal]);criado=r.insertId;}
   await auditar(q,usuario.id,null,id?'cadastro_editado_admin':'cadastro_criado_admin',{usuario_id:criado});
   return {id:criado,mensagem:id?'Cadastro atualizado.':'Pessoa cadastrada.'};
  }));
 }
 if(id&&metodo==='DELETE'){
  try{return ok(await transacao(async q=>{
   const [p]=await q('SELECT id,administrador FROM usuarios WHERE id=? FOR UPDATE',[id]);
   if(!p)erro('Pessoa não encontrada.',404);
   if(p.administrador||id===usuario.id)erro('Contas administrativas não podem ser excluídas por esta página.',403);
   const [r]=await q('SELECT (SELECT COUNT(*) FROM campanhas WHERE usuario_id=?)+(SELECT COUNT(*) FROM ajudas WHERE usuario_id=?)+(SELECT COUNT(*) FROM pagamentos WHERE usuario_id=?) AS total',[id,id,id]);
   if(Number(r.total))erro('Esta pessoa possui histórico. Use Bloquear acesso para preservá-lo.',409);
   for(const tabela of ['sessoes','avisos','identidades','perfis'])await q(`DELETE FROM ${tabela} WHERE usuario_id=?`,[id]);
   await q('DELETE FROM usuarios WHERE id=?',[id]);
   await auditar(q,usuario.id,null,'cadastro_excluido_admin',{usuario_id:id});
   return {mensagem:'Cadastro sem histórico excluído.'};
  }));}catch(e){if(e.code==='ER_ROW_IS_REFERENCED_2')erro('O cadastro possui vínculos. Use Bloquear acesso para preservar o histórico.',409);throw e;}
 }
 erro('Operação de cadastro não encontrada.',404);
}
module.exports={atenderPessoas};
