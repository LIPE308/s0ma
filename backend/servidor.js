// Node puro: servidor HTTP, JSON, SQL e funções. Sem Express e sem ORM.
const http = require('node:http');
const { randomBytes, randomUUID } = require('node:crypto');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { resolve, join, extname, sep } = require('node:path');
// O .env é opcional, mas precisa ser lido antes de criar a conexão com o banco.
const arquivoConfiguracao = join(__dirname, '.env');
if (existsSync(arquivoConfiguracao)) process.loadEnvFile(arquivoConfiguracao);
const { banco, consultar, transacao, inicializarBanco } = require('./banco');
const { erro, texto, inteiro, opcao, gerarSenha, conferirSenha, resumirToken, usuarioPublico, lerCorpo } = require('./auxiliares');

const categorias = ['Família', 'Saúde', 'Educação', 'Comunidade', 'Instituições', 'Proteção animal', 'Meio ambiente', 'Cultura'];
const consultaCampanhas = 'SELECT c.*, u.nome AS responsavel FROM campanhas c JOIN usuarios u ON u.id = c.usuario_id';
const consultaNecessidades = `SELECT n.*, c.titulo AS campanha, c.regiao, c.instrucoes, c.estado AS campanha_estado, c.usuario_id AS responsavel_id,
  COALESCE((SELECT SUM(a.quantidade - a.recebido) FROM ajudas a WHERE a.necessidade_id = n.id AND a.estado IN ('reservado','em_andamento')), 0) AS reservado
  FROM necessidades n JOIN campanhas c ON c.id = n.campanha_id`;
const consultaAjudas = `SELECT a.*, u.nome AS pessoa, c.titulo AS campanha, c.usuario_id AS responsavel_id, c.instrucoes,
  COALESCE(n.nome, 'Participação na ação') AS necessidade FROM ajudas a JOIN usuarios u ON u.id = a.usuario_id
  JOIN campanhas c ON c.id = a.campanha_id LEFT JOIN necessidades n ON n.id = a.necessidade_id`;

function responder(resposta, codigo, dados) {
  resposta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  resposta.end(JSON.stringify(dados));
}

async function identificarUsuario(requisicao) {
  const cabecalho = requisicao.headers.authorization;
  if (!cabecalho) return null;
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  if (!/^[a-f0-9]{64}$/.test(token)) erro('Faça login novamente.', 401);
  const [usuario] = await consultar('SELECT u.* FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.resumo_token = ? AND s.expira_em > ?', [resumirToken(token), Date.now()]);
  if (!usuario) erro('Sua sessão expirou. Faça login novamente.', 401);
  return usuario;
}
function exigirLogin(usuario) { if (!usuario) erro('Entre na sua conta para continuar.', 401); }
function exigirAdministrador(usuario) { exigirLogin(usuario); if (!usuario.administrador) erro('Esta ação é exclusiva do administrador.', 403); }
function exigirResponsavel(usuario, campanha) {
  exigirLogin(usuario);
  if (campanha.usuario_id !== usuario.id && !usuario.administrador) erro('Você não é responsável por esta campanha.', 403);
}
async function obterCampanha(id, consulta = consultar, bloquear = false) {
  const [campanha] = await consulta(`SELECT * FROM campanhas WHERE id = ?${bloquear ? ' FOR UPDATE' : ''}`, [id]);
  if (!campanha) erro('Campanha não encontrada.', 404);
  return campanha;
}
function conferirVisibilidade(campanha, usuario) {
  if (!['ativa', 'encerrada'].includes(campanha.estado) && (!usuario || (usuario.id !== campanha.usuario_id && !usuario.administrador))) erro('Campanha não disponível.', 404);
}
async function obterNecessidade(id, consulta = consultar) {
  const [necessidade] = await consulta(`${consultaNecessidades} WHERE n.id = ?`, [id]);
  if (!necessidade) erro('Necessidade não encontrada.', 404);
  necessidade.reservado = Number(necessidade.reservado);
  return necessidade;
}
async function avisar(consulta, usuarioId, mensagem) {
  await consulta('INSERT INTO avisos (usuario_id, mensagem) VALUES (?, ?)', [usuarioId, mensagem]);
}

function validarPedido(pedido) {
  if (!pedido || typeof pedido !== 'object') erro('Pedido inválido.');
  return {
    id: pedido.id ? texto(pedido.id, 'o identificador', 36) : randomUUID(),
    nome: texto(pedido.nome, 'o nome do pedido', 150),
    tipo: opcao(pedido.tipo, ['objeto', 'tarefa', 'dinheiro'], 'tipo'),
    meta: inteiro(pedido.meta, 'a meta'),
    tipo_meta: opcao(pedido.tipo_meta || 'fechada', ['fechada', 'aberta'], 'meta'),
    prioridade: opcao(pedido.prioridade || 'Normal', ['Normal', 'Alta'], 'prioridade'),
    prazo: texto(pedido.prazo || '', 'o prazo', 30, false),
    descricao: texto(pedido.descricao || '', 'as instruções', 2000, false),
  };
}

async function salvarPedido(consulta, campanhaId, pedido) {
  const [existente] = await consulta('SELECT * FROM necessidades WHERE id = ? FOR UPDATE', [pedido.id]);
  if (existente) {
    if (existente.campanha_id !== campanhaId) erro('Este pedido pertence a outra campanha.', 403);
    const atual = await obterNecessidade(pedido.id, consulta);
    const [pendentes] = await consulta("SELECT COALESCE(SUM(valor_liquido), 0) AS total FROM pagamentos WHERE necessidade_id = ? AND estado = 'pendente'", [pedido.id]);
    if (pedido.meta < atual.recebido + atual.reservado + Number(pendentes.total)) erro('A meta não pode ficar abaixo do que já foi recebido ou reservado.', 409);
    const [historico] = await consulta('SELECT (SELECT COUNT(*) FROM ajudas WHERE necessidade_id = ?) + (SELECT COUNT(*) FROM pagamentos WHERE necessidade_id = ?) AS total', [pedido.id, pedido.id]);
    if (pedido.tipo !== existente.tipo && (atual.recebido > 0 || Number(historico.total) > 0)) erro('Não altere o tipo de um pedido com histórico.', 409);
    await consulta('UPDATE necessidades SET nome=?, tipo=?, meta=?, tipo_meta=?, prioridade=?, prazo=?, descricao=? WHERE id=?', [pedido.nome, pedido.tipo, pedido.meta, pedido.tipo_meta, pedido.prioridade, pedido.prazo, pedido.descricao, pedido.id]);
  } else {
    await consulta('INSERT INTO necessidades (id,campanha_id,nome,tipo,meta,tipo_meta,prioridade,prazo,descricao) VALUES (?,?,?,?,?,?,?,?,?)', [pedido.id, campanhaId, pedido.nome, pedido.tipo, pedido.meta, pedido.tipo_meta, pedido.prioridade, pedido.prazo, pedido.descricao]);
  }
}

async function calcularSaldo(campanhaId, consulta = consultar) {
  const [arrecadacao] = await consulta("SELECT COALESCE(SUM(recebido),0) AS total FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'", [campanhaId]);
  const [solicitacoes] = await consulta("SELECT COALESCE(SUM(CASE WHEN estado='solicitado' THEN valor ELSE 0 END),0) AS reservado, COALESCE(SUM(CASE WHEN estado='concluido' THEN valor ELSE 0 END),0) AS repassado FROM repasses WHERE campanha_id=?", [campanhaId]);
  const confirmado = Number(arrecadacao.total);
  const reservado = Number(solicitacoes.reservado);
  const repassado = Number(solicitacoes.repassado);
  return { confirmado, reservado, repassado, disponivel: confirmado - reservado - repassado, simulado: true };
}

// Também serve o front compilado: um único endereço para apresentar em sala.
function servirFront(caminho, resposta) {
  const pasta = resolve(__dirname, '..', 'dist');
  let arquivo = resolve(pasta, '.' + caminho);
  if (!arquivo.startsWith(pasta + sep) && arquivo !== pasta) { responder(resposta, 404, { mensagem: 'Arquivo não encontrado.' }); return; }
  if (!existsSync(arquivo) || !statSync(arquivo).isFile()) {
    arquivo = join(pasta, 'index.html');
  }
  if (!existsSync(arquivo)) { responder(resposta, 404, { mensagem: 'API funcionando. Compile o front com npm run compilar:web ou use o Expo.' }); return; }
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json' };
  resposta.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] || 'application/octet-stream' });
  resposta.end(readFileSync(arquivo));
}

async function atender(requisicao, resposta) {
  try {
    const origem = requisicao.headers.origin;
    const origemPermitida = origem && (/^http:\/\/(localhost|127\.0\.0\.1):(8081|8082|3001)$/.test(origem) || origem === process.env.ORIGEM_WEB);
    if (origem && !origemPermitida) erro('Origem não permitida.', 403);
    if (origemPermitida) { resposta.setHeader('Access-Control-Allow-Origin', origem); resposta.setHeader('Vary', 'Origin'); }
    resposta.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    resposta.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (requisicao.method === 'OPTIONS') { resposta.writeHead(204); resposta.end(); return; }
    const endereco = new URL(requisicao.url, 'http://localhost');
    const caminho = decodeURIComponent(endereco.pathname);
    const metodo = requisicao.method;
    if (!caminho.startsWith('/api/')) {
      if (metodo !== 'GET') erro('Rota não encontrada.', 404);
      servirFront(caminho, resposta); return;
    }
    if (caminho === '/api/saude' && metodo === 'GET') { await consultar('SELECT 1'); responder(resposta, 200, { mensagem: 'Servidor e MySQL funcionando.', banco: 'MySQL', financeiro: 'simulado' }); return; }
    const usuario = await identificarUsuario(requisicao);
    const dados = ['POST', 'PUT', 'PATCH'].includes(metodo) ? await lerCorpo(requisicao) : {};
    let resultado;
    let codigo = 200;
    let partes;

    // 1. Conta e sessão. Nunca guardamos a senha original no banco.
    if (caminho === '/api/cadastro' && metodo === 'POST') {
      const nome = texto(dados.nome, 'o nome', 150);
      const email = texto(dados.email, 'o e-mail', 150).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erro('E-mail inválido.');
      if (typeof dados.senha !== 'string' || dados.senha.length < 6 || dados.senha.length > 128) erro('A senha precisa ter de 6 a 128 caracteres.');
      const senha = gerarSenha(dados.senha);
      const insercao = await consultar('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal) VALUES (?,?,?,?)', [nome, email, senha.resumo, senha.sal]);
      const [novoUsuario] = await consultar('SELECT * FROM usuarios WHERE id=?', [insercao.insertId]);
      resultado = usuarioPublico(novoUsuario); codigo = 201;
    } else if (caminho === '/api/login' && metodo === 'POST') {
      const email = texto(dados.email, 'o e-mail', 150).toLowerCase();
      if (typeof dados.senha !== 'string' || dados.senha.length > 128) erro('E-mail ou senha incorretos.', 401);
      const [pessoa] = await consultar('SELECT * FROM usuarios WHERE email=?', [email]);
      if (!pessoa || !conferirSenha(dados.senha, pessoa)) erro('E-mail ou senha incorretos.', 401);
      const token = randomBytes(32).toString('hex');
      await consultar('DELETE FROM sessoes WHERE expira_em <= ?', [Date.now()]);
      await consultar('INSERT INTO sessoes (resumo_token,usuario_id,expira_em) VALUES (?,?,?)', [resumirToken(token), pessoa.id, Date.now() + 86400000]);
      resultado = { token, usuario: usuarioPublico(pessoa) };
    } else if (caminho === '/api/sair' && metodo === 'POST') {
      exigirLogin(usuario);
      await consultar('DELETE FROM sessoes WHERE resumo_token=?', [resumirToken(requisicao.headers.authorization.slice(7))]);
      resultado = { mensagem: 'Você saiu da conta.' };
    } else if (caminho === '/api/perfil' && metodo === 'GET') {
      exigirLogin(usuario); resultado = usuarioPublico(usuario);
    } else if (caminho === '/api/perfil' && metodo === 'PUT') {
      exigirLogin(usuario);
      const nome = texto(dados.nome ?? usuario.nome, 'o nome', 150);
      const telefone = texto(dados.telefone ?? usuario.telefone, 'o telefone', 30, false);
      const regiao = texto(dados.regiao ?? usuario.regiao, 'a região', 150, false);
      if (dados.novidades !== undefined && typeof dados.novidades !== 'boolean') erro('Preferência inválida.');
      await consultar('UPDATE usuarios SET nome=?,telefone=?,regiao=?,novidades=? WHERE id=?', [nome, telefone, regiao, Number(dados.novidades ?? usuario.novidades), usuario.id]);
      const [pessoa] = await consultar('SELECT * FROM usuarios WHERE id=?', [usuario.id]); resultado = usuarioPublico(pessoa);

    // 2. Campanhas e pedidos.
    } else if (caminho === '/api/campanhas' && metodo === 'GET') {
      if (endereco.searchParams.get('minhas') === '1') { exigirLogin(usuario); resultado = await consultar(`${consultaCampanhas} WHERE c.usuario_id=? ORDER BY c.criada_em DESC`, [usuario.id]); }
      else resultado = await consultar(`${consultaCampanhas} WHERE c.estado IN ('ativa','encerrada') ORDER BY c.criada_em DESC`);
    } else if ((caminho === '/api/campanhas' && metodo === 'POST') || ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)$/)) && metodo === 'PUT')) {
      exigirLogin(usuario);
      const id = partes ? partes[1] : randomUUID();
      const titulo = texto(dados.titulo, 'o título', 150);
      const descricao = texto(dados.descricao, 'a descrição', 10000);
      const categoria = opcao(dados.categoria, categorias, 'categoria');
      const regiao = texto(dados.regiao, 'a região', 150);
      const prazo = texto(dados.prazo, 'o prazo', 30);
      const instrucoes = texto(dados.instrucoes || '', 'as instruções', 2000, false);
      const evento = texto(dados.evento || '', 'a ação', 1000, false);
      if (!Array.isArray(dados.necessidades) || !dados.necessidades.length || dados.necessidades.length > 30) erro('Inclua de 1 a 30 necessidades.');
      const pedidos = dados.necessidades.map(validarPedido);
      if (new Set(pedidos.map(p => p.id)).size !== pedidos.length) erro('Há pedidos duplicados.');
      await transacao(async consulta => {
        if (metodo === 'PUT') {
          const campanha = await obterCampanha(id, consulta, true); exigirResponsavel(usuario, campanha);
          await consulta('UPDATE campanhas SET titulo=?,descricao=?,categoria=?,regiao=?,prazo=?,instrucoes=?,evento=? WHERE id=?', [titulo, descricao, categoria, regiao, prazo, instrucoes, evento, id]);
          const anteriores = await consulta('SELECT id, recebido FROM necessidades WHERE campanha_id=?', [id]);
          for (const anterior of anteriores.filter(p => !pedidos.some(n => n.id === p.id))) {
            const [historico] = await consulta('SELECT (SELECT COUNT(*) FROM ajudas WHERE necessidade_id=?) + (SELECT COUNT(*) FROM pagamentos WHERE necessidade_id=?) AS total', [anterior.id, anterior.id]);
            if (Number(historico.total) || anterior.recebido) erro('Não remova um pedido que já tem histórico.', 409);
            await consulta('DELETE FROM necessidades WHERE id=?', [anterior.id]);
          }
        } else await consulta('INSERT INTO campanhas (id,usuario_id,titulo,descricao,categoria,regiao,prazo,instrucoes,evento) VALUES (?,?,?,?,?,?,?,?,?)', [id, usuario.id, titulo, descricao, categoria, regiao, prazo, instrucoes, evento]);
        for (const pedido of pedidos) await salvarPedido(consulta, id, pedido);
      });
      const [campanha] = await consultar(`${consultaCampanhas} WHERE c.id=?`, [id]);
      resultado = { ...campanha, necessidades: await consultar(`${consultaNecessidades} WHERE n.campanha_id=?`, [id]) }; codigo = metodo === 'POST' ? 201 : 200;
    } else if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)$/)) && metodo === 'GET') {
      const campanha = await obterCampanha(partes[1]); conferirVisibilidade(campanha, usuario);
      const [comResponsavel] = await consultar(`${consultaCampanhas} WHERE c.id=?`, [campanha.id]);
      resultado = { ...comResponsavel, necessidades: await consultar(`${consultaNecessidades} WHERE n.campanha_id=?`, [campanha.id]) };
    } else if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)(?:\/encerrar)?$/)) && (metodo === 'DELETE' || metodo === 'PATCH')) {
      resultado = await transacao(async consulta => {
        const campanha = await obterCampanha(partes[1], consulta, true); exigirResponsavel(usuario, campanha);
        await consulta("UPDATE campanhas SET estado='encerrada',motivo=? WHERE id=?", [texto(dados.motivo || 'Campanha encerrada pelo responsável.', 'o motivo', 1000), campanha.id]);
        return { mensagem: 'Campanha encerrada. O histórico foi preservado.' };
      });
    } else if (caminho === '/api/necessidades' && metodo === 'GET') {
      const lista = await consultar(`${consultaNecessidades} WHERE c.estado='ativa'`);
      const busca = (endereco.searchParams.get('busca') || '').toLocaleLowerCase();
      const tipo = endereco.searchParams.get('tipo'); const regiao = endereco.searchParams.get('regiao');
      resultado = lista.filter(n => (!tipo || n.tipo === tipo) && (!regiao || n.regiao.includes(regiao)) && `${n.nome} ${n.campanha}`.toLocaleLowerCase().includes(busca)).map(n => ({ ...n, reservado: Number(n.reservado) }));
    } else if ((partes = caminho.match(/^\/api\/necessidades\/([^/]+)$/)) && metodo === 'GET') {
      resultado = await obterNecessidade(partes[1]); conferirVisibilidade(await obterCampanha(resultado.campanha_id), usuario);
    } else if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/atualizacoes$/))) {
      const campanha = await obterCampanha(partes[1]); conferirVisibilidade(campanha, usuario);
      if (metodo === 'GET') resultado = await consultar('SELECT a.*,u.nome AS autor FROM atualizacoes a JOIN usuarios u ON u.id=a.usuario_id WHERE a.campanha_id=? ORDER BY a.id DESC', [campanha.id]);
      else if (metodo === 'POST') { exigirResponsavel(usuario, campanha); const insercao = await consultar('INSERT INTO atualizacoes (campanha_id,usuario_id,titulo,relato) VALUES (?,?,?,?)', [campanha.id, usuario.id, texto(dados.titulo, 'o título', 150), texto(dados.relato, 'o relato', 10000)]); resultado = { id: insercao.insertId }; codigo = 201; }
      else erro('Método não permitido.', 405);

    // 3. Ajudas: reservar, acompanhar, cancelar e confirmar.
    } else if (caminho === '/api/ajudas' && metodo === 'POST') {
      exigirLogin(usuario);
      const tipo = opcao(dados.tipo, ['objeto', 'tarefa', 'acao'], 'tipo de ajuda');
      const quantidade = inteiro(dados.quantidade ?? 1, 'a quantidade', 1, 10000);
      resultado = await transacao(async consulta => {
        const pedido = tipo === 'acao' ? null : await obterNecessidade(texto(dados.necessidade_id, 'a necessidade', 36), consulta);
        const campanha = await obterCampanha(pedido ? pedido.campanha_id : texto(dados.campanha_id, 'a campanha', 36), consulta, true);
        if (campanha.estado !== 'ativa') erro('Esta campanha não está recebendo novas ajudas.', 409);
        if (campanha.usuario_id === usuario.id) erro('Use outra conta para oferecer ajuda à sua campanha.', 403);
        if (pedido) {
          await consulta('SELECT id FROM necessidades WHERE id=? FOR UPDATE', [pedido.id]);
          const atual = await obterNecessidade(pedido.id, consulta);
          if (atual.tipo !== tipo) erro('O tipo de ajuda não corresponde ao pedido.');
          if (quantidade > atual.meta - atual.recebido - atual.reservado) erro('Não há quantidade ou vagas suficientes.', 409);
        } else {
          if (!campanha.evento) erro('Esta campanha não tem uma ação.');
          if (quantidade !== 1) erro('Registre uma participação por pessoa.');
          const [existente] = await consulta("SELECT id FROM ajudas WHERE campanha_id=? AND usuario_id=? AND tipo='acao' AND estado<>'cancelado'", [campanha.id, usuario.id]);
          if (existente) erro('Você já participa desta ação.', 409);
        }
        const insercao = await consulta('INSERT INTO ajudas (usuario_id,campanha_id,necessidade_id,tipo,quantidade,entrega,horario,observacao) VALUES (?,?,?,?,?,?,?,?)', [usuario.id, campanha.id, pedido?.id || null, tipo, quantidade, texto(dados.entrega || '', 'a entrega', 300, false), texto(dados.horario || '', 'o horário', 100, false), texto(dados.observacao || '', 'a observação', 2000, false)]);
        await avisar(consulta, campanha.usuario_id, `${usuario.nome} registrou uma ajuda em ${campanha.titulo}.`);
        return { id: insercao.insertId, mensagem: 'Ajuda registrada.' };
      }); codigo = 201;
    } else if ((partes = caminho.match(/^\/api\/ajudas\/(\d+)(?:\/(cancelar|confirmar))?$/))) {
      exigirLogin(usuario);
      const [ajuda] = await consultar(`${consultaAjudas} WHERE a.id=?`, [partes[1]]);
      if (!ajuda) erro('Ajuda não encontrada.', 404);
      if (![ajuda.usuario_id, ajuda.responsavel_id].includes(usuario.id) && !usuario.administrador) erro('Você não pode acessar esta ajuda.', 403);
      if (metodo === 'GET' && !partes[2]) resultado = ajuda;
      else if (metodo === 'PATCH' && partes[2]) resultado = await transacao(async consulta => {
        await obterCampanha(ajuda.campanha_id, consulta, true);
        if (ajuda.necessidade_id) await consulta('SELECT id FROM necessidades WHERE id=? FOR UPDATE', [ajuda.necessidade_id]);
        const [atual] = await consulta('SELECT * FROM ajudas WHERE id=? FOR UPDATE', [ajuda.id]);
        if (partes[2] === 'cancelar') {
          if (usuario.id !== atual.usuario_id) erro('Somente quem ofereceu pode cancelar a ajuda.', 403);
          if (atual.estado === 'realizado') erro('Uma ajuda realizada não pode ser cancelada.', 409);
          await consulta("UPDATE ajudas SET estado='cancelado' WHERE id=?", [atual.id]);
        } else {
          if (usuario.id !== ajuda.responsavel_id || usuario.id === atual.usuario_id) erro('Somente o responsável pode confirmar a ajuda de outra pessoa.', 403);
          const recebido = inteiro(dados.recebido, 'o total recebido', 0, atual.quantidade);
          if (atual.estado === 'cancelado' || recebido < atual.recebido) erro('Esta confirmação não é válida.', 409);
          if (atual.estado === 'realizado' && recebido !== atual.recebido) erro('Ajuda já concluída.', 409);
          const diferenca = recebido - atual.recebido;
          const estado = recebido === atual.quantidade ? 'realizado' : dados.cancelar_restante === true ? 'cancelado' : 'em_andamento';
          if (atual.necessidade_id && diferenca) await consulta('UPDATE necessidades SET recebido=recebido+? WHERE id=?', [diferenca, atual.necessidade_id]);
          await consulta('UPDATE ajudas SET recebido=?,estado=? WHERE id=?', [recebido, estado, atual.id]);
          if (diferenca) await avisar(consulta, atual.usuario_id, `Recebimento registrado: ${recebido} de ${atual.quantidade}.`);
        }
        const [salva] = await consulta(`${consultaAjudas} WHERE a.id=?`, [ajuda.id]); return salva;
      });
      else erro('Método não permitido.', 405);
    } else if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/ajudas$/)) && metodo === 'GET') {
      exigirResponsavel(usuario, await obterCampanha(partes[1])); resultado = await consultar(`${consultaAjudas} WHERE a.campanha_id=? ORDER BY a.id DESC`, [partes[1]]);
    } else if (caminho === '/api/atividade' && metodo === 'GET') {
      exigirLogin(usuario);
      resultado = { ajudas: await consultar(`${consultaAjudas} WHERE a.usuario_id=? ORDER BY a.id DESC`, [usuario.id]), campanhas: await consultar(`${consultaCampanhas} WHERE c.usuario_id=? ORDER BY c.criada_em DESC`, [usuario.id]), pagamentos: await consultar('SELECT p.*,n.nome AS necessidade,c.titulo AS campanha FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id JOIN campanhas c ON c.id=n.campanha_id WHERE p.usuario_id=? ORDER BY p.id DESC', [usuario.id]) };

    // 4. Dinheiro de apresentação. Nenhuma chamada a banco ou provedor financeiro.
    } else if (caminho === '/api/pagamentos' && metodo === 'POST') {
      exigirLogin(usuario);
      const valor = inteiro(dados.valor, 'o valor em centavos', 1000);
      const taxaSoma = Math.round(valor * 4 / 100); const taxaProvedor = 300;
      const liquido = valor - taxaSoma - taxaProvedor;
      const meio = opcao(dados.meio, ['Pix', 'Crédito', 'Débito'], 'meio');
      resultado = await transacao(async consulta => {
        const pedido = await obterNecessidade(texto(dados.necessidade_id, 'a necessidade', 36), consulta);
        const campanha = await obterCampanha(pedido.campanha_id, consulta, true);
        const [atual] = await consulta('SELECT * FROM necessidades WHERE id=? FOR UPDATE', [pedido.id]);
        if (campanha.estado !== 'ativa' || atual.tipo !== 'dinheiro') erro('Este pedido não recebe doações financeiras.', 409);
        const [pendentes] = await consulta("SELECT COALESCE(SUM(valor_liquido),0) AS total FROM pagamentos WHERE necessidade_id=? AND estado='pendente'", [pedido.id]);
        if (atual.tipo_meta === 'fechada' && liquido > atual.meta - atual.recebido - Number(pendentes.total)) erro('O líquido ultrapassa o restante da meta fechada.', 409);
        const insercao = await consulta('INSERT INTO pagamentos (usuario_id,necessidade_id,valor,taxa_soma,taxa_provedor,valor_liquido,meio) VALUES (?,?,?,?,?,?,?)', [usuario.id, pedido.id, valor, taxaSoma, taxaProvedor, liquido, meio]);
        return { id: insercao.insertId, simulado: true };
      }); codigo = 201;
    } else if ((partes = caminho.match(/^\/api\/pagamentos\/(\d+)(?:\/simular)?$/))) {
      exigirLogin(usuario);
      const [pagamento] = await consultar('SELECT p.*,n.campanha_id,n.nome AS necessidade,c.titulo AS campanha FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id JOIN campanhas c ON c.id=n.campanha_id WHERE p.id=?', [partes[1]]);
      if (!pagamento) erro('Pagamento não encontrado.', 404);
      if (pagamento.usuario_id !== usuario.id && !usuario.administrador) erro('Você não pode acessar este pagamento.', 403);
      if (metodo === 'GET') resultado = { ...pagamento, simulado: true };
      else if (metodo === 'PATCH' && caminho.endsWith('/simular')) resultado = await transacao(async consulta => {
        await obterCampanha(pagamento.campanha_id, consulta, true);
        await consulta('SELECT id FROM necessidades WHERE id=? FOR UPDATE', [pagamento.necessidade_id]);
        const [atual] = await consulta('SELECT * FROM pagamentos WHERE id=? FOR UPDATE', [pagamento.id]);
        const estado = opcao(dados.estado, ['confirmado', 'cancelado', 'reembolsado'], 'estado simulado');
        if (estado !== atual.estado) {
          if (estado === 'reembolsado') {
            exigirAdministrador(usuario);
            if (atual.estado !== 'confirmado') erro('Somente pagamento confirmado pode ser reembolsado.', 409);
            const saldo = await calcularSaldo(pagamento.campanha_id, consulta);
            if (saldo.disponivel < atual.valor_liquido) erro('Não há saldo simulado disponível para devolver.', 409);
            await consulta('UPDATE necessidades SET recebido=recebido-? WHERE id=?', [atual.valor_liquido, atual.necessidade_id]);
          } else {
            if (atual.estado !== 'pendente') erro('O pagamento já foi finalizado.', 409);
            if (estado === 'confirmado') await consulta('UPDATE necessidades SET recebido=recebido+? WHERE id=?', [atual.valor_liquido, atual.necessidade_id]);
          }
          await consulta('UPDATE pagamentos SET estado=? WHERE id=?', [estado, atual.id]);
          await avisar(consulta, atual.usuario_id, `Pagamento de teste ${atual.id}: ${estado}.`);
        }
        const [salvo] = await consulta('SELECT * FROM pagamentos WHERE id=?', [atual.id]); return { ...salvo, simulado: true };
      });
      else erro('Método não permitido.', 405);
    } else if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/saldo$/)) && metodo === 'GET') {
      const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario, campanha);
      resultado = { ...await calcularSaldo(campanha.id), campanha: campanha.titulo, repasses: await consultar('SELECT * FROM repasses WHERE campanha_id=? ORDER BY id DESC', [campanha.id]) };
    } else if (caminho === '/api/repasses' && metodo === 'POST') {
      exigirLogin(usuario);
      resultado = await transacao(async consulta => {
        const campanha = await obterCampanha(texto(dados.campanha_id, 'a campanha', 36), consulta, true); exigirResponsavel(usuario, campanha);
        if (campanha.estado === 'suspensa') erro('Campanha suspensa não pode solicitar repasses.', 409);
        const valor = inteiro(dados.valor, 'o valor em centavos');
        const saldo = await calcularSaldo(campanha.id, consulta);
        if (valor > saldo.disponivel) erro('Valor acima do saldo disponível.', 409);
        const insercao = await consulta('INSERT INTO repasses (campanha_id,usuario_id,valor,finalidade) VALUES (?,?,?,?)', [campanha.id, usuario.id, valor, texto(dados.finalidade, 'a finalidade', 1000)]);
        return { id: insercao.insertId, simulado: true };
      }); codigo = 201;
    } else if ((partes = caminho.match(/^\/api\/repasses\/(\d+)(?:\/(cancelar|decidir))?$/))) {
      exigirLogin(usuario);
      const [repasse] = await consultar('SELECT r.*,c.titulo AS campanha FROM repasses r JOIN campanhas c ON c.id=r.campanha_id WHERE r.id=?', [partes[1]]);
      if (!repasse) erro('Repasse não encontrado.', 404);
      if (usuario.id !== repasse.usuario_id && !usuario.administrador) erro('Você não pode acessar este repasse.', 403);
      if (metodo === 'GET' && !partes[2]) resultado = { ...repasse, simulado: true };
      else if (metodo === 'PATCH' && partes[2]) resultado = await transacao(async consulta => {
        const campanha = await obterCampanha(repasse.campanha_id, consulta, true);
        const [atual] = await consulta('SELECT * FROM repasses WHERE id=? FOR UPDATE', [repasse.id]);
        let estado; let motivo;
        if (partes[2] === 'cancelar') { if (usuario.id !== atual.usuario_id) erro('Somente quem solicitou pode cancelar.', 403); estado = 'cancelado'; motivo = 'Cancelado pelo responsável.'; }
        else { exigirAdministrador(usuario); if (campanha.usuario_id === usuario.id) erro('Não aprove um repasse da sua própria campanha.', 403); estado = opcao(dados.estado, ['concluido', 'recusado'], 'decisão'); motivo = texto(dados.motivo, 'o motivo', 1000); if (campanha.estado === 'suspensa' && estado === 'concluido') erro('Campanha suspensa.', 409); }
        if (atual.estado !== estado) {
          if (atual.estado !== 'solicitado') erro('O pedido já foi finalizado.', 409);
          await consulta('UPDATE repasses SET estado=?,motivo=? WHERE id=?', [estado, motivo, atual.id]);
          await avisar(consulta, atual.usuario_id, `Repasse de teste ${atual.id}: ${estado}.`);
        }
        const [salvo] = await consulta('SELECT * FROM repasses WHERE id=?', [atual.id]); return { ...salvo, simulado: true };
      });
      else erro('Método não permitido.', 405);

    // 5. Denúncias, avisos e administração.
    } else if (caminho === '/api/denuncias' && metodo === 'POST') {
      exigirLogin(usuario); const campanha = await obterCampanha(texto(dados.campanha_id, 'a campanha', 36));
      const insercao = await consultar('INSERT INTO denuncias (campanha_id,usuario_id,motivo,relato) VALUES (?,?,?,?)', [campanha.id, usuario.id, texto(dados.motivo, 'o motivo', 150), texto(dados.relato, 'o relato', 5000)]);
      resultado = { id: insercao.insertId, mensagem: 'Denúncia registrada para análise.' }; codigo = 201;
    } else if (caminho === '/api/avisos' && metodo === 'GET') { exigirLogin(usuario); resultado = await consultar('SELECT * FROM avisos WHERE usuario_id=? ORDER BY id DESC', [usuario.id]);
    } else if ((partes = caminho.match(/^\/api\/avisos\/(\d+)$/)) && metodo === 'PATCH') {
      exigirLogin(usuario); const alteracao = await consultar('UPDATE avisos SET lido=1 WHERE id=? AND usuario_id=?', [partes[1], usuario.id]); if (!alteracao.affectedRows) erro('Aviso não encontrado.', 404); resultado = { mensagem: 'Aviso lido.' };
    } else if (caminho === '/api/administracao' && metodo === 'GET') {
      exigirAdministrador(usuario);
      resultado = { campanhas: await consultar(`${consultaCampanhas} ORDER BY c.criada_em DESC`), denuncias: await consultar("SELECT d.*,c.titulo AS campanha FROM denuncias d JOIN campanhas c ON c.id=d.campanha_id WHERE d.estado='pendente' ORDER BY d.id DESC"), repasses: await consultar("SELECT r.*,c.titulo AS campanha FROM repasses r JOIN campanhas c ON c.id=r.campanha_id WHERE r.estado='solicitado' ORDER BY r.id DESC"), pagamentos: await consultar("SELECT p.*,c.titulo AS campanha FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id JOIN campanhas c ON c.id=n.campanha_id WHERE p.estado='confirmado' ORDER BY p.id DESC") };
    } else if ((partes = caminho.match(/^\/api\/administracao\/campanhas\/([^/]+)$/)) && metodo === 'PATCH') {
      exigirAdministrador(usuario);
      resultado = await transacao(async consulta => {
        const campanha = await obterCampanha(partes[1], consulta, true);
        const estado = opcao(dados.estado, ['ativa', 'suspensa', 'ajustes'], 'decisão');
        if (campanha.usuario_id === usuario.id) erro('Não analise a própria campanha.', 403);
        const motivo = texto(dados.motivo, 'a justificativa', 1000);
        await consulta('UPDATE campanhas SET estado=?,motivo=? WHERE id=?', [estado, motivo, campanha.id]);
        await avisar(consulta, campanha.usuario_id, `Sua campanha está ${estado}: ${motivo}`);
        return { mensagem: 'Decisão registrada.', estado };
      });
    } else if ((partes = caminho.match(/^\/api\/administracao\/denuncias\/(\d+)$/)) && metodo === 'PATCH') {
      exigirAdministrador(usuario); const alteracao = await consultar("UPDATE denuncias SET estado='analisada' WHERE id=?", [partes[1]]); if (!alteracao.affectedRows) erro('Denúncia não encontrada.', 404); resultado = { mensagem: 'Denúncia marcada como analisada.' };
    } else erro('Rota não encontrada.', 404);
    responder(resposta, codigo, resultado);
  } catch (problema) {
    if (problema.code === 'ER_DUP_ENTRY') responder(resposta, 409, { mensagem: 'Este e-mail ou identificador já está cadastrado.' });
    else if (problema.code === 'ER_ROW_IS_REFERENCED_2') responder(resposta, 409, { mensagem: 'Há histórico vinculado a este registro.' });
    else { if (!problema.codigo) console.error('Falha na API:', problema.code || problema.message); responder(resposta, problema.codigo || 500, { mensagem: problema.codigo ? problema.message : 'Erro no servidor. Confira a conexão com o MySQL.' }); }
  }
}

const servidor = http.createServer(atender);
servidor.requestTimeout = 30000;
async function iniciar() {
  await inicializarBanco();
  servidor.listen(Number(process.env.PORTA || 3001), process.env.ENDERECO || '127.0.0.1', () => console.log(`Soma: API e front compilado na porta ${servidor.address().port}. MySQL conectado.`));
}
function encerrar() { servidor.close(() => banco.end().then(() => process.exit(0))); }
process.on('SIGTERM', encerrar); process.on('SIGINT', encerrar);
iniciar().catch(problema => {
  console.error('Não foi possível iniciar. Código:', problema.code || problema.message);
  if (problema.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('O MySQL respondeu, mas recusou o usuário ou a senha.');
    console.error('Se usa MySQL instalado, execute backend/criar-banco.sql no Workbench com uma conta administradora.');
    console.error('Confira MYSQL_USUARIO e MYSQL_SENHA em backend/.env. A senha do exemplo só funciona com o usuário criado para este projeto.');
  } else if (problema.code === 'ECONNREFUSED' || problema.code === 'ETIMEDOUT') {
    console.error('Não foi possível conectar ao MySQL. Confira o serviço, MYSQL_HOST e MYSQL_PORTA.');
    console.error('Com Docker: abra o Docker Desktop, espere o Engine iniciar e execute npm run banco:iniciar.');
    console.error('Com MySQL instalado: inicie o serviço MySQL do Windows. Veja docs/WINDOWS.md.');
  } else if (problema.code === 'ER_BAD_DB_ERROR') {
    console.error('O banco configurado não existe. Execute backend/criar-banco.sql no MySQL e confira MYSQL_BANCO em backend/.env.');
  } else {
    console.error('Confira a configuração do MySQL em backend/.env. Veja docs/BACKEND.md.');
  }
  banco.end().finally(() => { process.exitCode = 1; });
});
