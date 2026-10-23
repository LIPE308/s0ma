const { randomBytes, createHash } = require('node:crypto');
const { OAuth2Client } = require('google-auth-library');
const { erro, gerarSenha, resumirToken, usuarioPublico } = require('./auxiliares');
const pendencias = new Map();
const entregas = new Map();
const chave = () => randomBytes(32).toString('hex');
function configuracao() {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: segredo, GOOGLE_REDIRECT_URI: retorno, ORIGEM_WEB: front } = process.env;
  if (!id || !segredo || !retorno || !front) erro('Login Google aguarda configuração do Google Cloud pela equipe.', 503);
  for (const url of [retorno, front]) {
    const u = new URL(url);
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) erro('Google exige HTTPS fora do computador local.', 503);
  }
  return { cliente: new OAuth2Client(id, segredo, retorno), front: new URL(front).origin, id, seguro: retorno.startsWith('https:') };
}
function cookie(req) { return /(?:^|;\s*)soma_google=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1]; }
function limpar() {
  for (const mapa of [pendencias, entregas]) for (const [id, valor] of mapa) if (valor.expira < Date.now()) mapa.delete(id);
}
async function atenderGoogle({ caminho, metodo, usuario, requisicao, resposta, endereco, dados, consultar, transacao }) {
  if (!caminho.startsWith('/api/google/')) return null;
  limpar();
  if (caminho === '/api/google/estado' && metodo === 'GET') return { configurado: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI && process.env.ORIGEM_WEB) };
  if (caminho === '/api/google/iniciar' && metodo === 'POST') {
    const cfg = configuracao();
    if (pendencias.size > 1000) erro('Tente novamente em instantes.', 429);
    if (dados.vincular && !usuario) erro('Entre com sua senha antes de vincular o Google.', 401);
    const state = chave(), navegador = chave(), nonce = chave(), verificador = randomBytes(48).toString('base64url');
    pendencias.set(state, { navegador, nonce, verificador, usuarioId: dados.vincular ? usuario.id : null, sessao: dados.vincular ? resumirToken(requisicao.headers.authorization.slice(7)) : null, expira: Date.now() + 600000 });
    resposta.setHeader('Set-Cookie', `soma_google=${navegador}; HttpOnly; SameSite=Lax; Path=/api/google; Max-Age=600${cfg.seguro ? '; Secure' : ''}`);
    return { url: cfg.cliente.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state, nonce, code_challenge: createHash('sha256').update(verificador).digest('base64url'), code_challenge_method: 'S256', prompt: 'select_account' }) };
  }
  if (caminho === '/api/google/retorno' && metodo === 'GET') {
    const cfg = configuracao();
    const state = endereco.searchParams.get('state'), pendente = pendencias.get(state);
    if (!pendente || pendente.navegador !== cookie(requisicao)) erro('Tentativa Google expirada ou navegador diferente.', 400);
    pendencias.delete(state);
    let entrega;
    try {
      if (pendente.usuarioId) {
        const [sessao] = await consultar('SELECT usuario_id FROM sessoes WHERE resumo_token=? AND usuario_id=? AND expira_em>?', [pendente.sessao, pendente.usuarioId, Date.now()]);
        if (!sessao) erro('A sessão de vinculação expirou. Entre novamente.', 401);
      }
      if (endereco.searchParams.has('error')) erro('A autorização Google foi cancelada.');
      const { tokens } = await cfg.cliente.getToken({ code: endereco.searchParams.get('code') || '', codeVerifier: pendente.verificador });
      const ticket = await cfg.cliente.verifyIdToken({ idToken: tokens.id_token || '', audience: cfg.id });
      const perfil = ticket.getPayload();
      if (!perfil?.sub || !perfil.email_verified || perfil.nonce !== pendente.nonce) erro('Identidade Google inválida.');
      const pessoa = await transacao(async consulta => {
        const [identidade] = await consulta('SELECT u.* FROM identidades_google g JOIN usuarios u ON u.id=g.usuario_id WHERE g.sub=?', [perfil.sub]);
        if (identidade) {
          if (pendente.usuarioId && identidade.id !== pendente.usuarioId) erro('Essa identidade já pertence a outra conta.', 409);
          return identidade;
        }
        let usuarioId = pendente.usuarioId;
        if (!usuarioId) {
          const [existente] = await consulta('SELECT id FROM usuarios WHERE email=?', [perfil.email.toLowerCase()]);
          if (existente) erro('Já existe uma conta com esse e-mail. Entre com sua senha e vincule o Google no perfil.', 409);
          const senha = gerarSenha(chave());
          const insercao = await consulta('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal) VALUES (?,?,?,?)', [(perfil.name || 'Pessoa Soma').slice(0, 150), perfil.email.toLowerCase(), senha.resumo, senha.sal]);
          usuarioId = insercao.insertId;
        }
        await consulta('INSERT INTO identidades_google (sub,usuario_id) VALUES (?,?)', [perfil.sub, usuarioId]);
        const [pessoa] = await consulta('SELECT * FROM usuarios WHERE id=?', [usuarioId]); return pessoa;
      });
      entrega = { usuarioId: pessoa.id };
    } catch (e) { entrega = { erro: e.codigo ? e.message : 'Não foi possível verificar o Google. Tente novamente.' }; }
    const codigo = chave();
    entregas.set(codigo, { ...entrega, navegador: pendente.navegador, expira: Date.now() + 60000 });
    resposta.writeHead(303, { Location: cfg.front + '/google?codigo=' + codigo, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); resposta.end();
    return { redirecionado: true };
  }
  if (caminho === '/api/google/resgatar' && metodo === 'POST') {
    const entrega = entregas.get(dados.codigo);
    if (!entrega || entrega.navegador !== cookie(requisicao)) erro('Retorno Google expirado ou já utilizado.', 400);
    entregas.delete(dados.codigo);
    resposta.setHeader('Set-Cookie', 'soma_google=; HttpOnly; SameSite=Lax; Path=/api/google; Max-Age=0');
    if (entrega.erro) erro(entrega.erro);
    const [pessoa] = await consultar('SELECT * FROM usuarios WHERE id=?', [entrega.usuarioId]);
    const token = chave();
    await consultar('INSERT INTO sessoes (resumo_token,usuario_id,expira_em) VALUES (?,?,?)', [resumirToken(token), pessoa.id, Date.now() + 86400000]);
    return { token, usuario: usuarioPublico(pessoa) };
  }
  erro('Rota Google não encontrada.', 404);
}
module.exports = { atenderGoogle };
