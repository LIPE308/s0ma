const NOME = 'soma_sessao';
function tokenDaRequisicao(req) {
  const h=req.headers.authorization;
  if(h!==undefined) return h.startsWith('Bearer ')?h.slice(7):'';
  return String(req.headers.cookie||'').match(/(?:^|;\s*)soma_sessao=([a-f0-9]{64})(?:;|$)/)?.[1]||'';
}
function gravarCookieSessao(req,res,token) {
  const seguro=Boolean(req.socket?.encrypted)||process.env.COOKIE_SEGURO==='1';
  const valor=NOME+'='+token+'; Path=/api; HttpOnly; SameSite=Lax; Max-Age='+(token?86400:0)+(seguro?'; Secure':'');
  const anterior=res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie',[...(Array.isArray(anterior)?anterior:anterior?[anterior]:[]),valor]);
}
module.exports={tokenDaRequisicao,gravarCookieSessao};
