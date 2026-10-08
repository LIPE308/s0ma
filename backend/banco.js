const mysql = require('mysql2/promise');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { gerarSenha } = require('./auxiliares');

const banco = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORTA || 3306),
  user: process.env.MYSQL_USUARIO || 'soma',
  password: process.env.MYSQL_SENHA ?? 'soma_local_123',
  database: process.env.MYSQL_BANCO || 'soma',
  connectionLimit: 5,
  charset: 'utf8mb4',
  timezone: 'Z',
});

async function consultar(comando, valores = []) {
  const [resultado] = await banco.execute(comando, valores);
  return resultado;
}

// Tudo é confirmado junto ou desfeito junto: uma transação não deixa metade salva.
async function transacao(operacao) {
  const conexao = await banco.getConnection();
  try {
    // Depois de esperar o lock, a consulta deve enxergar a reserva mais recente.
    await conexao.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conexao.beginTransaction();
    const consultarNaTransacao = async (comando, valores = []) => {
      const [resultado] = await conexao.execute(comando, valores);
      return resultado;
    };
    const resultado = await operacao(consultarNaTransacao);
    await conexao.commit();
    return resultado;
  } catch (problema) {
    await conexao.rollback();
    throw problema;
  } finally { conexao.release(); }
}

async function inicializarBanco() {
  // Cada comando é executado separado; não permitimos multipleStatements.
  const esquema = readFileSync(join(__dirname, 'esquema.sql'), 'utf8');
  for (const comando of esquema.split(';').filter(comando => comando.trim())) await banco.query(comando);
  const [contagem] = await consultar('SELECT COUNT(*) AS total FROM usuarios');
  if (Number(contagem.total) > 0) return;
  // Exemplos apenas no banco vazio. Reiniciar não apaga o trabalho da turma.
  await transacao(async consultar => {
    for (const [nome, email, regiao, administrador] of [
      ['Ana Oliveira', 'ana@exemplo.com', 'Campinas, Centro', 0],
      ['Marina Souza', 'marina@exemplo.com', 'Campinas, Centro', 0],
      ['Lucas Pereira', 'lucas@exemplo.com', 'Campinas, Taquaral', 0],
      ['Administrador', 'admin@exemplo.com', '', 1],
    ]) {
      const senha = gerarSenha('academico123');
      await consultar('INSERT INTO usuarios (nome, email, senha_resumo, senha_sal, regiao, administrador) VALUES (?, ?, ?, ?, ?, ?)', [nome, email, senha.resumo, senha.sal, regiao, administrador]);
    }
    for (const valores of [
      ['familia', 2, 'Ajude uma família a recomeçar', 'Uma família com duas crianças precisa reorganizar a casa após uma mudança.', 'Família', 'Campinas, Centro', '30/10/2026', 'Centro comunitário, Rua das Flores, 120. Sábado, das 9h às 12h.', 'Bazar solidário: sábado, das 14h às 17h, no centro comunitário.'],
      ['biblioteca', 1, 'Biblioteca para todos', 'Vamos ampliar o acesso aos livros e equipar a biblioteca da comunidade.', 'Educação', 'Campinas, Centro', '30/10/2026', 'Entregue os livros na biblioteca, das 9h às 17h.', ''],
      ['abrigo', 3, 'Abrigo do bairro', 'Conforto e cuidado para os animais acolhidos no abrigo.', 'Proteção animal', 'Campinas, Taquaral', '30/10/2026', 'Entregue cobertores limpos no abrigo, das 9h às 12h.', ''],
    ]) await consultar('INSERT INTO campanhas (id, usuario_id, titulo, descricao, categoria, regiao, prazo, instrucoes, evento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', valores);
    for (const valores of [
      ['cobertores', 'familia', 'Cobertores', 'objeto', 10, 8, 'Cobertores limpos e em bom estado.'],
      ['alimentos', 'familia', 'Caixas de alimentos', 'objeto', 5, 3, 'Alimentos não perecíveis dentro da validade.'],
      ['organizar', 'familia', 'Organizar as doações', 'tarefa', 5, 0, 'Separar itens e preparar as mesas. Sábado, das 9h às 12h.'],
      ['equipamento', 'biblioteca', 'Equipamento para a biblioteca', 'dinheiro', 200000, 125000, 'Equipamento comunitário. Dinheiro simulado em centavos.'],
      ['livros', 'biblioteca', 'Livros infantis', 'objeto', 20, 12, 'Livros infantis em bom estado.'],
      ['abrigo', 'abrigo', 'Cobertores para o abrigo', 'objeto', 10, 4, 'Cobertores para os animais acolhidos.'],
    ]) await consultar('INSERT INTO necessidades (id, campanha_id, nome, tipo, meta, recebido, descricao, prazo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [...valores, '30/10/2026']);
    await consultar("INSERT INTO ajudas (usuario_id, campanha_id, necessidade_id, tipo, quantidade, entrega, horario) VALUES (3, 'biblioteca', 'livros', 'objeto', 2, 'Biblioteca', 'Sábado, 10h')");
    await consultar("INSERT INTO ajudas (usuario_id, campanha_id, necessidade_id, tipo, quantidade, horario) VALUES (3, 'familia', 'organizar', 'tarefa', 2, 'Sábado, 9h')");
    await consultar("INSERT INTO atualizacoes (campanha_id, usuario_id, titulo, relato) VALUES ('biblioteca', 1, 'Doze novos livros recebidos', 'Os livros já estão na biblioteca. Ainda faltam oito livros infantis.')");
    await consultar("INSERT INTO atualizacoes (campanha_id, usuario_id, titulo, relato) VALUES ('familia', 2, 'Oito cobertores recebidos', 'As primeiras entregas chegaram. Ainda faltam dois cobertores.')");
  });
}
module.exports = { banco, consultar, transacao, inicializarBanco };
