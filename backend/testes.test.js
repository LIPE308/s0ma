// Testes de integração: usam um banco separado, nunca apagam o banco soma.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { createConnection } = require('mysql2/promise');
const { resumirToken, gerarSenha } = require('./auxiliares');

const nomeBanco = `soma_teste_${process.pid}_${Date.now()}`;
const configuracao = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORTA || 3306),
  user: process.env.MYSQL_TESTE_USUARIO || 'root',
  password: process.env.MYSQL_TESTE_SENHA ?? 'raiz_local_123',
};
let conexao, processo, endereco;
let moderadorTeste;
const publicacoesEmAndamento = new Map();
async function iniciarServidor() {
  processo = spawn(process.execPath, ['backend/servidor.js'], { env: { ...process.env, MYSQL_HOST: configuracao.host, MYSQL_PORTA: String(configuracao.port), MYSQL_USUARIO: configuracao.user, MYSQL_SENHA: configuracao.password, MYSQL_BANCO: nomeBanco, PORTA: '0', ENDERECO: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((concluir, rejeitar) => {
    let saida = '';
    const prazo = setTimeout(() => rejeitar(new Error(`Servidor não iniciou: ${saida}`)), 30000);
    processo.stdout.on('data', trecho => { saida += trecho; const encontrado = saida.match(/porta (\d+)/); if (encontrado) { endereco = `http://127.0.0.1:${encontrado[1]}/api`; clearTimeout(prazo); concluir(); } });
    processo.stderr.on('data', trecho => { saida += trecho; });
    processo.once('error', problema => { clearTimeout(prazo); rejeitar(problema); });
    processo.once('exit', codigo => { clearTimeout(prazo); rejeitar(new Error(`Servidor encerrou (${codigo}): ${saida}`)); });
  });
}
async function pararServidor() {
  if (processo && processo.exitCode === null) { const fim = once(processo, 'exit'); processo.kill('SIGTERM'); await fim; }
}
async function chamar(caminho, { metodo = 'GET', dados, token, codigo = 200, chave } = {}) {
  const resposta = await fetch(endereco + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(chave ? { 'Idempotency-Key': chave } : {}) }, ...(dados !== undefined ? { body: JSON.stringify(dados) } : {}) });
  const resultado = await resposta.json();
  assert.equal(resposta.status, codigo, `${metodo} ${caminho}: ${JSON.stringify(resultado)}`);
  // Os cenários legados usam campanhas aprovadas; a nova revisão é exercida explicitamente.
  if (moderadorTeste && resultado.estado === 'rascunho' && ['POST','PUT','PATCH'].includes(metodo) && /^\/campanhas(?:\/[^/]+(?:\/reabrir)?)?$/.test(caminho)) {
    if (!publicacoesEmAndamento.has(resultado.id)) publicacoesEmAndamento.set(resultado.id, (async () => {
      const atual = await chamar('/campanhas/'+resultado.id,{token});
      if (atual.estado !== 'rascunho') return atual;
      await chamar('/perfil-ampliado',{metodo:'PUT',token,dados:{tipo:'pessoa',adulto:true,publico:false,local_publico:false,apoios_publicos:false}});
      await chamar('/campanhas/'+resultado.id+'/enviar',{metodo:'POST',token});
      await chamar('/administracao/campanhas/'+resultado.id,{metodo:'PATCH',token:moderadorTeste,dados:{estado:'ativa',motivo:'Aprovação explícita da fixture de regressão'}});
      return chamar('/campanhas/'+resultado.id,{token});
    })());
    try { return await publicacoesEmAndamento.get(resultado.id); } finally { publicacoesEmAndamento.delete(resultado.id); }
  }
  return resultado;
}
async function entrar(email, senha = 'academico123') { return chamar('/login', { metodo: 'POST', dados: { email, senha } }); }
function rascunho(titulo, necessidades) { return { titulo, descricao: 'Campanha de teste acadêmico', categoria: 'Educação', regiao: 'Campinas, Centro', prazo: '30/10/2026', instrucoes: 'Entregar na biblioteca', evento: 'Sábado, 10h', necessidades }; }
function pedido(nome, tipo, meta) { return { nome, tipo, meta, tipo_meta: 'fechada', prioridade: 'Normal', prazo: '30/10/2026', descricao: 'Instruções de teste' }; }

test('API Node + MySQL: fluxos completos e persistência', { timeout: 90000 }, async turma => {
  let ana, lucas, marina, administrador, novo, campanha, ajuda, vencedor, pagamento, repasse, legado, envioCampanha;
  try {
    conexao = await createConnection(configuracao);
    await conexao.query(`CREATE DATABASE ${nomeBanco} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    // Simulate the existing schema: initialization must add only the missing schema pieces.
    await conexao.query(`USE ${nomeBanco}`);
    const esquemaAnterior = readFileSync('backend/esquema.sql', 'utf8').replace(/^.*estado_antes_moderacao.*\r?\n/m, '');
    for (const comando of esquemaAnterior.split(';').filter(item => item.trim() && !item.includes('CREATE TABLE IF NOT EXISTS operacoes'))) await conexao.query(comando);
    await iniciarServidor();
    const [colunasMigradas] = await conexao.query("SHOW COLUMNS FROM campanhas LIKE 'estado_antes_moderacao'");
    assert.equal(colunasMigradas.length, 1);
    const [operacoesMigradas] = await conexao.query("SHOW TABLES LIKE 'operacoes'");
    assert.equal(operacoesMigradas.length, 1);
    // Credentials belong only to this isolated test database, never to the application bootstrap.
    for (const email of ['ana@exemplo.com', 'lucas@exemplo.com', 'marina@exemplo.com']) {
      const senha = gerarSenha('academico123');
      await conexao.execute(`UPDATE ${nomeBanco}.usuarios SET senha_resumo=?,senha_sal=? WHERE email=?`, [senha.resumo, senha.sal, email]);
    }
    await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Admin da suíte', email: 'admin-teste@exemplo.com', senha: 'academico123' }, codigo: 201 });
    const sessaoAntesDaPromocao = await entrar('admin-teste@exemplo.com');
    execFileSync(process.execPath, ['backend/configurar-admin.js', 'admin-teste@exemplo.com'], { env: { ...process.env, MYSQL_HOST: configuracao.host, MYSQL_PORTA: String(configuracao.port), MYSQL_USUARIO: configuracao.user, MYSQL_SENHA: configuracao.password, MYSQL_BANCO: nomeBanco }, timeout: 15000 });
    await turma.test('saúde, validação, SQL parametrizado e sessões', async () => {
      assert.equal((await chamar('/saude')).banco, 'MySQL');
      await chamar('/perfil', { codigo: 401 });
      await chamar('/login', { metodo: 'POST', dados: { email: 'ana@exemplo.com', senha: 'incorreta' }, codigo: 401 });
      await chamar('/login', { metodo: 'POST', dados: { email: "' OR 1=1 --@exemplo.com", senha: 'academico123' }, codigo: 401 });
      await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Pessoa', email: 'invalido', senha: '123456' }, codigo: 400 });
      const usuario = await chamar('/cadastro', { metodo: 'POST', dados: { nome: "D'Ávila", email: 'teste@exemplo.com', senha: 'academico123', administrador: true }, codigo: 201 });
      assert.equal(usuario.administrador, false); assert.equal(usuario.nome, "D'Ávila"); assert.equal(usuario.senha_resumo, undefined);
      await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Duplicado', email: 'teste@exemplo.com', senha: 'academico123' }, codigo: 409 });
      novo = await entrar('teste@exemplo.com'); ana = await entrar('ana@exemplo.com'); lucas = await entrar('lucas@exemplo.com'); marina = await entrar('marina@exemplo.com'); administrador = await entrar('admin-teste@exemplo.com');
      moderadorTeste = administrador.token;
      await chamar('/perfil', { token: sessaoAntesDaPromocao.token, codigo: 401 });
      assert.equal(administrador.usuario.administrador, true);
      await chamar('/login', { metodo: 'POST', dados: { email: 'admin@exemplo.com', senha: 'academico123' }, codigo: 401 });
      const [linhas] = await conexao.execute(`SELECT senha_resumo,senha_sal FROM ${nomeBanco}.usuarios WHERE id=?`, [usuario.id]);
      assert.equal(linhas[0].senha_resumo.length, 128); assert.notEqual(linhas[0].senha_resumo, 'academico123');
      const perfil = await chamar('/perfil', { metodo: 'PUT', token: novo.token, dados: { nome: 'Pessoa teste', telefone: '19999999999', regiao: 'Campinas', novidades: false, administrador: true } });
      assert.equal(perfil.administrador, false); assert.equal(perfil.novidades, false);
      await chamar('/administracao', { token: novo.token, codigo: 403 });
      await chamar('/perfil', { token: 'a'.repeat(64), codigo: 401 });
      const temporario = await entrar('teste@exemplo.com');
      await conexao.execute(`UPDATE ${nomeBanco}.sessoes SET expira_em=0 WHERE resumo_token=?`, [resumirToken(temporario.token)]);
      await chamar('/perfil', { token: temporario.token, codigo: 401 });
      const saida = await entrar('teste@exemplo.com'); await chamar('/sair', { metodo: 'POST', token: saida.token }); await chamar('/perfil', { token: saida.token, codigo: 401 });
      const malformada = await fetch(endereco + '/cadastro', { method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } }); assert.equal(malformada.status, 400);
      const origem = await fetch(endereco + '/saude', { headers: { Origin: 'http://origem-invalida.example' } }); assert.equal(origem.status, 403);
    });
    await turma.test('campanhas: criar, editar, consultar e desfazer falha', async () => {
      campanha = await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: rascunho('Campanha teste', [pedido('Último livro', 'objeto', 1), pedido('Organização', 'tarefa', 2), pedido('Equipamento', 'dinheiro', 100000)]), codigo: 201 });
      assert.equal(campanha.necessidades.length, 3);
      await chamar(`/campanhas/${campanha.id}`, { metodo: 'PUT', token: lucas.token, dados: rascunho('Alteração indevida', campanha.necessidades), codigo: 403 });
      campanha = await chamar(`/campanhas/${campanha.id}`, { metodo: 'PUT', token: novo.token, dados: rascunho('Título atualizado', campanha.necessidades) });
      const quantidade = (await chamar('/campanhas')).length;
      await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: rascunho('Não pode salvar metade', [{ ...pedido('Nome ocupado', 'objeto', 1), id: 'livros' }]), codigo: 403 });
      assert.equal((await chamar('/campanhas')).length, quantidade);
      assert.equal((await chamar('/campanhas?minhas=1', { token: novo.token }))[0].titulo, 'Título atualizado');
    });
    await turma.test('reserva concorrente: somente uma pessoa fica com a última unidade', async () => {
      const necessidade = campanha.necessidades.find(item => item.tipo === 'objeto');
      await chamar('/ajudas', { metodo: 'POST', token: novo.token, dados: { tipo: 'objeto', necessidade_id: necessidade.id, quantidade: 1 }, codigo: 403 });
      const respostas = await Promise.all([ana, lucas].map(async pessoa => {
        const resposta = await fetch(endereco + '/ajudas', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pessoa.token}` }, body: JSON.stringify({ tipo: 'objeto', necessidade_id: necessidade.id, quantidade: 1 }) });
        return { codigo: resposta.status, dados: await resposta.json(), pessoa };
      }));
      assert.deepEqual(respostas.map(item => item.codigo).sort(), [201, 409]);
      const sucesso = respostas.find(item => item.codigo === 201); ajuda = sucesso.dados; vencedor = sucesso.pessoa;
      const reservada = await chamar(`/necessidades/${necessidade.id}`); assert.equal(reservada.reservado, 1); assert.equal(reservada.recebido, 0);
      await chamar(`/ajudas/${ajuda.id}`, { token: marina.token, codigo: 403 });
      await chamar(`/ajudas/${ajuda.id}/confirmar`, { metodo: 'PATCH', token: vencedor.token, dados: { recebido: 1 }, codigo: 403 });
      await chamar(`/ajudas/${ajuda.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 1 } });
      await chamar(`/ajudas/${ajuda.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 1 } });
      const confirmada = await chamar(`/necessidades/${necessidade.id}`); assert.equal(confirmada.recebido, 1); assert.equal(confirmada.reservado, 0);
      await chamar(`/ajudas/${ajuda.id}/cancelar`, { metodo: 'PATCH', token: vencedor.token, codigo: 409 });
      await chamar(`/campanhas/${campanha.id}`, { metodo: 'PUT', token: novo.token, dados: rascunho('Não apagar histórico', campanha.necessidades.filter(item => item.id !== necessidade.id)), codigo: 409 });
      assert.equal((await chamar(`/campanhas/${campanha.id}`)).titulo, 'Título atualizado');
    });
    await turma.test('recebimento parcial, cancelamento, ação, atualizações e avisos', async () => {
      const tarefa = campanha.necessidades.find(item => item.tipo === 'tarefa');
      const reserva = await chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'tarefa', necessidade_id: tarefa.id, quantidade: 2 }, codigo: 201 });
      await chamar(`/ajudas/${reserva.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 1 } });
      assert.equal((await chamar(`/necessidades/${tarefa.id}`)).reservado, 1);
      await chamar(`/ajudas/${reserva.id}/cancelar`, { metodo: 'PATCH', token: lucas.token });
      const parcial = await chamar(`/necessidades/${tarefa.id}`); assert.equal(parcial.reservado, 0); assert.equal(parcial.recebido, 1);
      const acao = await chamar('/ajudas', { metodo: 'POST', token: marina.token, dados: { tipo: 'acao', campanha_id: campanha.id, quantidade: 1 }, codigo: 201 });
      await chamar('/ajudas', { metodo: 'POST', token: marina.token, dados: { tipo: 'acao', campanha_id: campanha.id, quantidade: 1 }, codigo: 409 });
      await chamar(`/ajudas/${acao.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 1 } });
      await chamar(`/campanhas/${campanha.id}/atualizacoes`, { metodo: 'POST', token: novo.token, dados: { titulo: 'Livro recebido', relato: 'A entrega chegou.' }, codigo: 201 });
      assert.equal((await chamar(`/campanhas/${campanha.id}/atualizacoes`))[0].titulo, 'Livro recebido');
      const avisos = await chamar('/avisos', { token: novo.token }); assert.ok(avisos.length >= 3);
      await chamar(`/avisos/${avisos[0].id}`, { metodo: 'PATCH', token: lucas.token, codigo: 404 });
      await chamar(`/avisos/${avisos[0].id}`, { metodo: 'PATCH', token: novo.token });
      assert.equal((await chamar('/avisos', { token: novo.token }))[0].lido, 1);
    });
    await turma.test('financeiro simulado: confirmação única, limites, repasse e reembolso', async () => {
      const necessidade = campanha.necessidades.find(item => item.tipo === 'dinheiro');
      pagamento = await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { necessidade_id: necessidade.id, valor: 10000, meio: 'Pix' }, codigo: 201 });
      const novoPagamento = await chamar(`/pagamentos/${pagamento.id}`, { token: ana.token });
      assert.equal(novoPagamento.valor_liquido, 10000); assert.equal(novoPagamento.taxa_soma + novoPagamento.taxa_provedor, 0);
      await chamar(`/pagamentos/${pagamento.id}`, { token: lucas.token, codigo: 403 });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 10000);
      // A historical fee record remains calculated using its original stored amount.
      legado = await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { necessidade_id: necessidade.id, valor: 10000, meio: 'Pix' }, codigo: 201 });
      await conexao.execute(`UPDATE ${nomeBanco}.pagamentos SET taxa_soma=400,taxa_provedor=300,valor_liquido=9300 WHERE id=?`, [legado.id]);
      await chamar(`/pagamentos/${legado.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 19300);
      await chamar(`/pagamentos/${legado.id}/simular`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'reembolsado' } });
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 10000);
      await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { necessidade_id: necessidade.id, valor: 150000, meio: 'Pix' }, codigo: 409 });
      await chamar('/repasses', { metodo: 'POST', token: lucas.token, dados: { campanha_id: campanha.id, valor: 1000, finalidade: 'Teste' }, codigo: 403 });
      const cancelavel = await chamar('/repasses', { metodo: 'POST', token: novo.token, dados: { campanha_id: campanha.id, valor: 1000, finalidade: 'Materiais' }, codigo: 201 });
      assert.equal((await chamar(`/campanhas/${campanha.id}/saldo`, { token: novo.token })).disponivel, 9000);
      await chamar(`/repasses/${cancelavel.id}/cancelar`, { metodo: 'PATCH', token: novo.token });
      repasse = await chamar('/repasses', { metodo: 'POST', token: novo.token, dados: { campanha_id: campanha.id, valor: 1000, finalidade: 'Materiais' }, codigo: 201 });
      await chamar('/repasses', { metodo: 'POST', token: novo.token, dados: { campanha_id: campanha.id, valor: 10000, finalidade: 'Acima do saldo' }, codigo: 409 });
      await chamar(`/repasses/${repasse.id}/decidir`, { metodo: 'PATCH', token: novo.token, dados: { estado: 'concluido', motivo: 'Teste' }, codigo: 403 });
      await chamar(`/repasses/${repasse.id}/decidir`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'concluido', motivo: 'Autorizado em teste' } });
      await chamar(`/repasses/${repasse.id}/decidir`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'concluido', motivo: 'Autorizado em teste' } });
      assert.equal((await chamar(`/campanhas/${campanha.id}/saldo`, { token: novo.token })).repassado, 1000);
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'reembolsado' }, codigo: 403 });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'reembolsado' }, codigo: 409 });
      const segundo = await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { necessidade_id: necessidade.id, valor: 10000, meio: 'Débito' }, codigo: 201 });
      await chamar(`/pagamentos/${segundo.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'reembolsado' } });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'reembolsado' } });
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 10000);
    });
    await turma.test('administração, suspensão, denúncia e encerramento preservam histórico', async () => {
      const denuncia = await chamar('/denuncias', { metodo: 'POST', token: lucas.token, dados: { campanha_id: campanha.id, motivo: 'Teste', relato: 'Verificar informações' }, codigo: 201 });
      assert.ok((await chamar('/administracao', { token: administrador.token })).denuncias.some(item => item.id === denuncia.id));
      await chamar(`/administracao/denuncias/${denuncia.id}`, { metodo: 'PATCH', token: administrador.token });
      await chamar(`/administracao/campanhas/${campanha.id}`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'suspensa', motivo: 'Teste de revisão' } });
      await chamar(`/campanhas/${campanha.id}`, { codigo: 404 });
      assert.equal((await chamar(`/campanhas/${campanha.id}`, { token: novo.token })).estado, 'suspensa');
      await chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'tarefa', necessidade_id: campanha.necessidades.find(item => item.tipo === 'tarefa').id, quantidade: 1 }, codigo: 409 });
      await chamar(`/administracao/campanhas/${campanha.id}`, { metodo: 'PATCH', token: administrador.token, dados: { estado: 'ativa', motivo: 'Revisado' } });
      await chamar(`/campanhas/${campanha.id}/encerrar`, { metodo: 'PATCH', token: novo.token, dados: { motivo: 'Concluída pela turma' } });
      assert.equal((await chamar(`/campanhas/${campanha.id}`)).estado, 'encerrada');
      assert.equal((await chamar(`/ajudas/${ajuda.id}`, { token: vencedor.token })).estado, 'realizado');
    });
    await turma.test('uma campanha com uma necessidade, reenvio concorrente e dados privados', async () => {
      const dados = rascunho('Uma necessidade independente', [pedido('Alimentos', 'objeto', 10)]);
      dados.instrucoes = 'LOCAL_PRIVADO: combinar com o responsável';
      const criar = () => chamar('/campanhas', { metodo: 'POST', token: novo.token, dados, codigo: 201, chave: 'campanha-envio-unico-2026' });
      const [primeira, repetida] = await Promise.all([criar(), criar()]);
      envioCampanha = { id: primeira.id, dados };
      assert.equal(primeira.id, repetida.id); assert.equal(primeira.necessidades.length, 1);
      assert.equal((await chamar('/campanhas')).filter(c => c.id === primeira.id).length, 1);
      await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: { ...dados, titulo: 'Outro conteúdo' }, chave: 'campanha-envio-unico-2026', codigo: 409 });
      await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: { ...dados, prazo: '30/02/2026' }, codigo: 400 });
      const publico = await chamar(`/campanhas/${primeira.id}`);
      assert.equal(publico.instrucoes, ''); assert.equal(publico.necessidades[0].instrucoes, ''); assert.equal(publico.motivo, '');
      assert.equal((await chamar('/campanhas')).find(c => c.id === primeira.id).instrucoes, '');
      assert.equal((await chamar('/necessidades')).find(n => n.id === primeira.necessidades[0].id).instrucoes, '');
      assert.match((await chamar(`/campanhas/${primeira.id}`, { token: novo.token })).instrucoes, /LOCAL_PRIVADO/);
      const necessidade = primeira.necessidades[0];
      await chamar('/ajudas', { metodo: 'POST', dados: { tipo: 'objeto', necessidade_id: necessidade.id, quantidade: 1 }, codigo: 401 });
      await chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'objeto', necessidade_id: necessidade.id, campanha_id: 'familia', quantidade: 1 }, codigo: 400 });
      const ajudar = () => chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'objeto', campanha_id: primeira.id, necessidade_id: necessidade.id, quantidade: 5 }, chave: 'ajuda-envio-unico-2026', codigo: 201 });
      const [a, b] = await Promise.all([ajudar(), ajudar()]); assert.equal(a.id, b.id);
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).reservado, 5);
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 0);
      assert.match((await chamar(`/ajudas/${a.id}`, { token: lucas.token })).instrucoes, /LOCAL_PRIVADO/);
      await chamar(`/ajudas/${a.id}`, { token: ana.token, codigo: 403 });
      await chamar(`/ajudas/${a.id}/confirmar`, { metodo: 'PATCH', token: lucas.token, dados: { recebido: 2 }, codigo: 403 });
      await chamar(`/ajudas/${a.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 2 } });
      await chamar(`/ajudas/${a.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 2 } });
      const parcial = await chamar(`/necessidades/${necessidade.id}`); assert.equal(parcial.recebido, 2); assert.equal(parcial.reservado, 3);
      assert.equal((await chamar(`/campanhas/${primeira.id}/ajudas`, { token: novo.token })).length, 1);
      assert.ok((await chamar('/atividade', { token: lucas.token })).ajudas.some(item => item.id === a.id));
    });
    await turma.test('metas do mesmo tipo são independentes; fechamento, moderação e reabertura preservam histórico', async () => {
      const criada = await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: rascunho('Duas metas independentes', [pedido('Roupas', 'objeto', 10), pedido('Alimentos', 'objeto', 12)]), codigo: 201 });
      const [roupas, alimentos] = criada.necessidades;
      const reserva = await chamar('/ajudas', { metodo: 'POST', token: ana.token, dados: { tipo: 'objeto', necessidade_id: roupas.id, quantidade: 5 }, codigo: 201 });
      await chamar(`/ajudas/${reserva.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 2 } });
      assert.equal((await chamar(`/necessidades/${roupas.id}`)).recebido, 2);
      assert.equal((await chamar(`/necessidades/${alimentos.id}`)).recebido, 0);
      const moderar = estado => chamar(`/administracao/campanhas/${criada.id}`, { metodo: 'PATCH', token: administrador.token, dados: { estado, motivo: 'Revisão manual de teste' } });
      await chamar(`/administracao/campanhas/${criada.id}`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'suspensa', motivo: 'Indevido' }, codigo: 403 });
      await moderar('suspensa');
      await chamar(`/campanhas/${criada.id}/encerrar`, { metodo: 'PATCH', token: novo.token, dados: { motivo: 'Tentar contornar moderação' }, codigo: 409 });
      await chamar(`/campanhas/${criada.id}`, { codigo: 404 }); await chamar(`/necessidades/${roupas.id}`, { codigo: 404 }); await chamar(`/campanhas/${criada.id}/atualizacoes`, { codigo: 404 });
      assert.equal((await chamar(`/campanhas/${criada.id}`, { token: administrador.token })).estado, 'suspensa');
      assert.ok(!(await chamar('/campanhas')).some(c => c.id === criada.id));
      await moderar('ativa');
      await chamar(`/campanhas/${criada.id}/encerrar`, { metodo: 'PATCH', token: novo.token, dados: { motivo: 'Encerrada com metas parciais' } });
      assert.equal((await chamar(`/campanhas/${criada.id}`)).estado, 'encerrada');
      await chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'objeto', necessidade_id: alimentos.id, quantidade: 1 }, codigo: 409 });
      await moderar('suspensa'); await moderar('ativa');
      assert.equal((await chamar(`/campanhas/${criada.id}`)).estado, 'encerrada');
      const reabrir = (dados, token = novo.token, codigo = 200) => chamar(`/campanhas/${criada.id}/reabrir`, { metodo: 'PATCH', token, dados, codigo });
      const dados = { ...criada, motivo_reabertura: 'Precisamos de mais roupas' };
      await reabrir({ ...dados, motivo_reabertura: '' }, novo.token, 400);
      await reabrir(dados, novo.token, 409);
      await reabrir({ ...dados, necessidades: [{ ...roupas, meta: 1 }, alimentos] }, novo.token, 409);
      assert.equal((await chamar(`/campanhas/${criada.id}`)).estado, 'encerrada');
      const novosDados = { ...dados, necessidades: [{ ...roupas, meta: 15 }, alimentos] };
      await reabrir(novosDados, ana.token, 403);
      const reaberta = await reabrir(novosDados);
      assert.equal(reaberta.estado, 'ativa');
      assert.equal(reaberta.necessidades.find(n => n.id === roupas.id).recebido, 2);
      assert.equal(reaberta.necessidades.find(n => n.id === alimentos.id).recebido, 0);
      assert.equal((await chamar(`/ajudas/${reserva.id}`, { token: ana.token })).recebido, 2);
    });
    await turma.test('denúncias duplicadas não ocultam campanhas; somente administrador consulta e analisa', async () => {
      const dados = { campanha_id: 'biblioteca', motivo: 'Revisar', relato: 'Verificação de teste sem afirmar fraude' };
      const respostas = await Promise.all([1, 2].map(async () => {
        const r = await fetch(endereco + '/denuncias', { method: 'POST', headers: { Authorization: `Bearer ${lucas.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
        assert.ok([200, 201].includes(r.status)); return r.json();
      }));
      assert.equal(respostas[0].id, respostas[1].id);
      assert.equal((await chamar('/campanhas/biblioteca')).estado, 'ativa');
      await chamar('/administracao', { codigo: 401 }); await chamar('/administracao', { token: lucas.token, codigo: 403 });
      await chamar(`/administracao/denuncias/${respostas[0].id}`, { metodo: 'PATCH', token: lucas.token, codigo: 403 });
      await chamar(`/administracao/denuncias/${respostas[0].id}`, { metodo: 'PATCH', token: administrador.token });
      assert.equal((await chamar('/administracao', { token: administrador.token })).denuncias.find(d => d.id === respostas[0].id).estado, 'analisada');
      assert.equal((await chamar('/campanhas/biblioteca')).denuncias, undefined);
    });
    await turma.test('campanha só financeira: simulação sem taxas, reenvio único e bloqueio de contribuição própria', async () => {
      const c = await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: rascunho('Somente simulação', [pedido('Materiais', 'dinheiro', 100000)]), codigo: 201 });
      const n = c.necessidades[0];
      const dados = { necessidade_id: n.id, campanha_id: c.id, valor: 10000, meio: 'Pix' };
      await chamar('/pagamentos', { metodo: 'POST', token: novo.token, dados, codigo: 403 });
      await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { ...dados, campanha_id: 'familia' }, codigo: 400 });
      const pagar = () => chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados, chave: 'pagamento-envio-unico-2026', codigo: 201 });
      const [a, b] = await Promise.all([pagar(), pagar()]); assert.equal(a.id, b.id);
      assert.equal((await chamar(`/necessidades/${n.id}`)).recebido, 0);
      await chamar(`/pagamentos/${a.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      await chamar(`/pagamentos/${a.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      assert.equal((await chamar(`/necessidades/${n.id}`)).recebido, 10000);
      await chamar(`/campanhas/${c.id}/encerrar`, { metodo: 'PATCH', token: novo.token });
      await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados, codigo: 409 });
    });
    await turma.test('campanha só de voluntariado confirma vagas sem criar metas artificiais', async () => {
      const c = await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: { ...rascunho('Somente tarefa', [pedido('Apoio', 'tarefa', 2)]), evento: '', instrucoes: '' }, codigo: 201 });
      assert.equal(c.necessidades.length, 1); assert.equal(c.necessidades[0].tipo, 'tarefa');
      const a = await chamar('/ajudas', { metodo: 'POST', token: lucas.token, dados: { tipo: 'tarefa', necessidade_id: c.necessidades[0].id, quantidade: 1 }, codigo: 201 });
      await chamar(`/ajudas/${a.id}/confirmar`, { metodo: 'PATCH', token: novo.token, dados: { recebido: 1 } });
      assert.equal((await chamar(`/campanhas/${c.id}`)).necessidades[0].recebido, 1);
    });
    await turma.test('reiniciar mantém cadastro, sessão, campanhas, ajudas e financeiro', async () => {
      await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Conta legada de teste', email: 'admin@exemplo.com', senha: 'senha-legada-de-teste' }, codigo: 201 });
      await conexao.query(`UPDATE ${nomeBanco}.usuarios SET administrador=1 WHERE email='admin@exemplo.com'`);
      const [antes] = await conexao.query(`SELECT COUNT(*) AS total FROM ${nomeBanco}.usuarios`);
      await pararServidor(); await iniciarServidor();
      const reenviada = await chamar('/campanhas', { metodo: 'POST', token: novo.token, dados: envioCampanha.dados, chave: 'campanha-envio-unico-2026', codigo: 201 });
      assert.equal(reenviada.id, envioCampanha.id);
      assert.equal((await chamar('/campanhas')).filter(c => c.id === envioCampanha.id).length, 1);
      const financeiroLegado = await chamar(`/pagamentos/${legado.id}`, { token: ana.token });
      assert.equal(financeiroLegado.valor_liquido, 9300); assert.equal(financeiroLegado.taxa_soma + financeiroLegado.taxa_provedor, 700);
      assert.equal((await entrar('admin@exemplo.com', 'senha-legada-de-teste')).usuario.administrador, false);
      assert.equal((await chamar('/perfil', { token: administrador.token })).administrador, true);
      assert.equal((await chamar('/perfil', { token: novo.token })).nome, 'Pessoa teste');
      assert.equal((await chamar(`/campanhas/${campanha.id}`)).titulo, 'Título atualizado');
      assert.equal((await chamar(`/ajudas/${ajuda.id}`, { token: vencedor.token })).estado, 'realizado');
      assert.equal((await chamar(`/pagamentos/${pagamento.id}`, { token: ana.token })).estado, 'reembolsado');
      assert.equal((await chamar(`/repasses/${repasse.id}`, { token: novo.token })).estado, 'concluido');
      const [quantidade] = await conexao.query(`SELECT COUNT(*) AS total FROM ${nomeBanco}.usuarios`); assert.equal(quantidade[0].total, antes[0].total);
    });
  } finally {
    await pararServidor();
    if (conexao) { await conexao.query(`DROP DATABASE ${nomeBanco}`); await conexao.end(); }
  }
});
