// OAuth oficial via google-auth-library. Sem credenciais, permanece indisponível.
const { OAuth2Client, CodeChallengeMethod } = require('google-auth-library');
const { randomBytes } = require('node:crypto');
const { erro, resumirToken, gerarSenha, usuarioPublico } = require('./auxiliares');
const { auditar } = require('./soma2');
function cookies(req) { return Object.fromEntries(String(req.headers.cookie || '').split(';').map(s=>s.trim().split('='))); }
function configuracao() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) return null;
  const uri=new URL(process.env.GOOGLE_REDIRECT_URI);
  if(uri.protocol!=='https:' && !['localhost','127.0.0.1'].includes(uri.hostname))throw new Error('Google exige HTTPS fora do computador local.');
  return {client:new OAuth2Client(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,uri.href),uri,seguro:uri.protocol==='https:'?'; Secure':''};
}
async function atenderGoogle(ctx) {
  const {caminho,metodo,usuario,consultar,transacao,requisicao,resposta,exigirLogin}=ctx;
  if(!caminho.startsWith('/api/auth/google/'))return null;
  const config=configuracao();
  if(!config)erro('Login Google ainda não configurado pela equipe. Use e-mail e senha.',503);
  const cookie=(nome,valor,tempo)=>nome+'='+valor+'; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age='+tempo+config.seguro;
  if((caminho==='/api/auth/google/iniciar' && metodo==='GET') || (caminho==='/api/auth/google/vincular' && metodo==='POST')){
    if(metodo==='POST')exigirLogin(usuario);
    const estado=randomBytes(32).toString('hex'),nonce=randomBytes(24).toString('hex');
    const pkce=await config.client.generateCodeVerifierAsync();
    await consultar('DELETE FROM oauth_fluxos WHERE expira_em<?',[Date.now()]);
    await consultar('INSERT INTO oauth_fluxos (resumo_estado,verificador,nonce,expira_em,usuario_id) VALUES (?,?,?,?,?)',[resumirToken(estado),pkce.codeVerifier,nonce,Date.now()+300000,metodo==='POST'?usuario.id:null]);
    resposta.setHeader('Set-Cookie',cookie('soma_oauth_estado',estado,300));
    const url=config.client.generateAuthUrl({access_type:'online',scope:['openid','email','profile'],state:estado,nonce,code_challenge:pkce.codeChallenge,code_challenge_method:CodeChallengeMethod.S256,prompt:'select_account'});
    if(metodo==='POST')return{resultado:{url}};
    resposta.writeHead(302,{Location:url,'Cache-Control':'no-store'});resposta.end();return{enviada:true};
  }
  if(caminho==='/api/auth/google/callback' && metodo==='GET'){
    const params=new URL(requisicao.url,'http://localhost').searchParams,estado=params.get('state'),code=params.get('code');
    if(!estado || !/^[a-f0-9]{64}$/.test(estado) || cookies(requisicao).soma_oauth_estado!==estado || !code || code.length>4000)erro('Retorno Google inválido. Inicie o acesso novamente.',400);
    const fluxo=await transacao(async consulta=>{
      const [f]=await consulta('SELECT * FROM oauth_fluxos WHERE resumo_estado=? FOR UPDATE',[resumirToken(estado)]);
      if(!f || Number(f.expira_em)<Date.now())erro('Acesso Google expirou. Tente novamente.',401);
      await consulta('DELETE FROM oauth_fluxos WHERE resumo_estado=?',[resumirToken(estado)]);return f;
    });
    let payload;
    try{
      const {tokens}=await config.client.getToken({code,codeVerifier:fluxo.verificador,redirect_uri:config.uri.href});
      if(!tokens.id_token)erro('Google não retornou identidade.',401);
      const ticket=await config.client.verifyIdToken({idToken:tokens.id_token,audience:process.env.GOOGLE_CLIENT_ID});
      payload=ticket.getPayload();
      if(!payload || payload.nonce!==fluxo.nonce || payload.email_verified!==true || !payload.email || !payload.sub)erro('Identidade Google não validada.',401);
    }catch{erro('Não foi possível validar o acesso Google. Tente novamente.',401);}
    const entrega=randomBytes(32).toString('hex');
    await transacao(async consulta=>{
      const [identidade]=await consulta("SELECT usuario_id FROM identidades WHERE provedor='google' AND sujeito=? FOR UPDATE",[payload.sub]);
      let id=identidade?.usuario_id;
      if(fluxo.usuario_id){
        if(id && id!==fluxo.usuario_id)erro('Esta identidade já pertence a outra conta.',409);
        id=fluxo.usuario_id;
      }
      if(!id){
        const [existente]=await consulta('SELECT id FROM usuarios WHERE email=?',[payload.email.toLowerCase()]);
        if(existente)erro('Este e-mail já tem cadastro. Entre com sua senha e vincule o Google pelo perfil.',409);
        const senha=gerarSenha(randomBytes(32).toString('base64url'));
        const r=await consulta('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal) VALUES (?,?,?,?)',[String(payload.name||'Pessoa SOMA').slice(0,150),payload.email.toLowerCase(),senha.resumo,senha.sal]);id=r.insertId;
      }
      if(!identidade)await consulta("INSERT INTO identidades (usuario_id,provedor,sujeito) VALUES (?,'google',?)",[id,payload.sub]);
      await consulta('INSERT INTO oauth_entregas (resumo_codigo,usuario_id,expira_em) VALUES (?,?,?)',[resumirToken(entrega),id,Date.now()+60000]);
      await auditar(consulta,id,null,'google_validado',{vinculacao:Boolean(fluxo.usuario_id)});
    });
    resposta.setHeader('Set-Cookie',[cookie('soma_oauth_estado','',0),cookie('soma_oauth_entrega',entrega,60)]);
    resposta.writeHead(302,{Location:config.uri.origin+'/google','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});resposta.end();return{enviada:true};
  }
  if(caminho==='/api/auth/google/trocar' && metodo==='POST'){
    const codigo=cookies(requisicao).soma_oauth_entrega;
    if(!/^[a-f0-9]{64}$/.test(codigo||''))erro('Acesso Google não disponível ou já utilizado.',401);
    const resultado=await transacao(async consulta=>{
      const [entrega]=await consulta('SELECT * FROM oauth_entregas WHERE resumo_codigo=? FOR UPDATE',[resumirToken(codigo)]);
      if(!entrega || Number(entrega.expira_em)<Date.now())erro('Acesso Google expirado.',401);
      await consulta('DELETE FROM oauth_entregas WHERE resumo_codigo=?',[resumirToken(codigo)]);
      const [pessoa]=await consulta('SELECT * FROM usuarios WHERE id=?',[entrega.usuario_id]);
      const token=randomBytes(32).toString('hex');
      await consulta('INSERT INTO sessoes (resumo_token,usuario_id,expira_em) VALUES (?,?,?)',[resumirToken(token),pessoa.id,Date.now()+86400000]);
      return{token,usuario:usuarioPublico(pessoa)};
    });
    resposta.setHeader('Set-Cookie',cookie('soma_oauth_entrega','',0));
    return{resultado};
  }
  erro('Rota Google não encontrada.',404);
}
module.exports={atenderGoogle,configuracao};
