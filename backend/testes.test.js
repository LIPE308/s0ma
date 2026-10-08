// Testes de integração: usam um banco separado, nunca apagam o banco soma.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createConnection } = require('mysql2/promise');
const { resumirToken } = require('./auxiliares');

const nomeBanco = `soma_teste_${process.pid}_${Date.now()}`;
const configuracao = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORTA || 3306),
  user: process.env.MYSQL_TESTE_USUARIO || 'root',
  password: process.env.MYSQL_TESTE_SENHA ?? 'raiz_local_123',
};
let conexao, processo, endereco;
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
async function chamar(caminho, { metodo = 'GET', dados, token, codigo = 200 } = {}) {
  const resposta = await fetch(endereco + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(dados !== undefined ? { body: JSON.stringify(dados) } : {}) });
  const resultado = await resposta.json();
  assert.equal(resposta.status, codigo, `${metodo} ${caminho}: ${JSON.stringify(resultado)}`);
  return resultado;
}
async function entrar(email, senha = 'academico123') { return chamar('/login', { metodo: 'POST', dados: { email, senha } }); }
function rascunho(titulo, necessidades) { return { titulo, descricao: 'Campanha de teste acadêmico', categoria: 'Educação', regiao: 'Campinas, Centro', prazo: '30/10/2026', instrucoes: 'Entregar na biblioteca', evento: 'Sábado, 10h', necessidades }; }
function pedido(nome, tipo, meta) { return { nome, tipo, meta, tipo_meta: 'fechada', prioridade: 'Normal', prazo: '30/10/2026', descricao: 'Instruções de teste' }; }

test('API Node + MySQL: fluxos completos e persistência', { timeout: 90000 }, async turma => {
  let ana, lucas, marina, administrador, novo, campanha, ajuda, vencedor, pagamento, repasse;
  try {
    conexao = await createConnection(configuracao);
    await conexao.query(`CREATE DATABASE ${nomeBanco} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await iniciarServidor();
    await turma.test('saúde, validação, SQL parametrizado e sessões', async () => {
      assert.equal((await chamar('/saude')).banco, 'MySQL');
      await chamar('/perfil', { codigo: 401 });
      await chamar('/login', { metodo: 'POST', dados: { email: 'ana@exemplo.com', senha: 'incorreta' }, codigo: 401 });
      await chamar('/login', { metodo: 'POST', dados: { email: "' OR 1=1 --@exemplo.com", senha: 'academico123' }, codigo: 401 });
      await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Pessoa', email: 'invalido', senha: '123456' }, codigo: 400 });
      const usuario = await chamar('/cadastro', { metodo: 'POST', dados: { nome: "D'Ávila", email: 'teste@exemplo.com', senha: 'academico123', administrador: true }, codigo: 201 });
      assert.equal(usuario.administrador, false); assert.equal(usuario.nome, "D'Ávila"); assert.equal(usuario.senha_resumo, undefined);
      await chamar('/cadastro', { metodo: 'POST', dados: { nome: 'Duplicado', email: 'teste@exemplo.com', senha: 'academico123' }, codigo: 409 });
      novo = await entrar('teste@exemplo.com'); ana = await entrar('ana@exemplo.com'); lucas = await entrar('lucas@exemplo.com'); marina = await entrar('marina@exemplo.com'); administrador = await entrar('admin@exemplo.com');
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
      assert.equal((await chamar(`/pagamentos/${pagamento.id}`, { token: ana.token })).valor_liquido, 9300);
      await chamar(`/pagamentos/${pagamento.id}`, { token: lucas.token, codigo: 403 });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      await chamar(`/pagamentos/${pagamento.id}/simular`, { metodo: 'PATCH', token: ana.token, dados: { estado: 'confirmado' } });
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 9300);
      await chamar('/pagamentos', { metodo: 'POST', token: ana.token, dados: { necessidade_id: necessidade.id, valor: 150000, meio: 'Pix' }, codigo: 409 });
      await chamar('/repasses', { metodo: 'POST', token: lucas.token, dados: { campanha_id: campanha.id, valor: 1000, finalidade: 'Teste' }, codigo: 403 });
      const cancelavel = await chamar('/repasses', { metodo: 'POST', token: novo.token, dados: { campanha_id: campanha.id, valor: 1000, finalidade: 'Materiais' }, codigo: 201 });
      assert.equal((await chamar(`/campanhas/${campanha.id}/saldo`, { token: novo.token })).disponivel, 8300);
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
      assert.equal((await chamar(`/necessidades/${necessidade.id}`)).recebido, 9300);
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
    await turma.test('reiniciar mantém cadastro, sessão, campanhas, ajudas e financeiro', async () => {
      await pararServidor(); await iniciarServidor();
      assert.equal((await chamar('/perfil', { token: novo.token })).nome, 'Pessoa teste');
      assert.equal((await chamar(`/campanhas/${campanha.id}`)).titulo, 'Título atualizado');
      assert.equal((await chamar(`/ajudas/${ajuda.id}`, { token: vencedor.token })).estado, 'realizado');
      assert.equal((await chamar(`/pagamentos/${pagamento.id}`, { token: ana.token })).estado, 'reembolsado');
      assert.equal((await chamar(`/repasses/${repasse.id}`, { token: novo.token })).estado, 'concluido');
      const [quantidade] = await conexao.query(`SELECT COUNT(*) AS total FROM ${nomeBanco}.usuarios`); assert.equal(quantidade[0].total, 5);
    });
  } finally {
    await pararServidor();
    if (conexao) { await conexao.query(`DROP DATABASE ${nomeBanco}`); await conexao.end(); }
  }
});
