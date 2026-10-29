const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { converterSQL } = require('./postgres');

test('PostgreSQL: esquema, consultas existentes, upserts, restrições e rollback', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    const schema = readFileSync(join(__dirname, 'esquema-postgres.sql'), 'utf8');
    await db.exec(schema);
    await db.exec(schema); // Reapplying cannot erase accounts or create duplicate markers.
    await db.exec(readFileSync(join(__dirname, 'indices-postgres.sql'), 'utf8'));
    await db.exec(readFileSync(join(__dirname, 'migracao-admin-postgres.sql'), 'utf8'));
    await db.exec(readFileSync(join(__dirname, 'migracao-admin-postgres.sql'), 'utf8'));
    // Validate the actual static queries used by the API against PostgreSQL.
    const ts = require('typescript');
    let indice = 0;
    for (const arquivo of ['servidor.js','soma2.js','google.js','experiencia.js','marcos.js','operacoes.js','administracao.js','notificacoes.js']) {
      const ast = ts.createSourceFile(arquivo, readFileSync(join(__dirname, arquivo), 'utf8'), ts.ScriptTarget.Latest, true);
      const consultas = [];
      function visitar(no) {
        if (ts.isCallExpression(no) && no.arguments[0] && ts.isStringLiteral(no.arguments[0]) && /^(SELECT|INSERT|UPDATE|DELETE)\b/i.test(no.arguments[0].text)) consultas.push(no.arguments[0].text);
        ts.forEachChild(no, visitar);
      }
      visitar(ast);
      for (const sql of consultas) await db.exec('PREPARE validar_' + indice++ + ' AS ' + converterSQL(sql));
    }
    assert.ok(indice >= 179);
    const q = (sql, valores = []) => db.query(converterSQL(sql), valores);
    const usuario = (await q('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal) VALUES (?,?,?,?)', ['Maria', 'maria@teste.local', 'resumo', 'sal'])).rows[0];
    await q('INSERT IGNORE INTO perfis (usuario_id) VALUES (?)', [usuario.id]);
    assert.equal((await q('INSERT IGNORE INTO perfis (usuario_id) VALUES (?)', [usuario.id])).rows.length, 0);
    await q('INSERT INTO perfis (usuario_id,foto_google) VALUES (?,?) ON DUPLICATE KEY UPDATE foto_google=COALESCE(VALUES(foto_google),foto_google)', [usuario.id, 'https://foto.test/?abc']);
    await q('INSERT INTO campanhas (id,usuario_id,titulo,descricao,categoria,regiao,prazo) VALUES (?,?,?,?,?,?,?)', ['camp',usuario.id,'Título','Descrição','Educação','Campinas','30/10/2026']);
    for (let i=0;i<2;i++) await q('INSERT INTO campanhas_detalhes (campanha_id,visualizacoes) VALUES (?,1) ON DUPLICATE KEY UPDATE visualizacoes=visualizacoes+1', ['camp']);
    assert.equal((await q('SELECT visualizacoes FROM campanhas_detalhes')).rows[0].visualizacoes, 2);
    await q('INSERT IGNORE INTO visualizacoes (campanha_id,visitante,dia) VALUES (?,?,UTC_DATE())', ['camp','visitante']);
    await q('INSERT INTO operacoes (usuario_id,chave,resumo) VALUES (?,?,?) ON DUPLICATE KEY UPDATE chave=chave', [usuario.id,'teste','hash']);
    await assert.rejects(q('INSERT INTO perfis (usuario_id,publico) VALUES (?,2)', [usuario.id]), { code: '23514' });
    await assert.rejects(q('INSERT INTO avisos (usuario_id,mensagem) VALUES (?,?)', [9999,'inválido']), { code: '23503' });
    await db.exec('BEGIN');
    await q('UPDATE usuarios SET nome=? WHERE id=?', ['Alterado',usuario.id]);
    await db.exec('ROLLBACK');
    assert.equal((await q('SELECT nome FROM usuarios WHERE id=?', [usuario.id])).rows[0].nome, 'Maria');
    // Exercita as consultas dinâmicas do painel e a fila no PostgreSQL, sem rede.
    const consultar = async (sql, valores=[]) => (await q(sql, valores)).rows;
    const transacao = async executar => {
      await db.exec('BEGIN');
      try { const resultado=await executar(consultar);await db.exec('COMMIT');return resultado; }
      catch(e) { await db.exec('ROLLBACK');throw e; }
    };
    const { atenderAdministracao } = require('./administracao');
    const contexto = { caminho:'/api/administracao/painel',metodo:'GET',usuario:{id:usuario.id,administrador:true},dados:{},consultar,transacao,exigirAdministrador:()=>{},requisicao:{url:'/api/administracao/painel'} };
    assert.equal((await atenderAdministracao(contexto)).resultado.pessoas.total,1);
    for(const tipo of ['campanhas','urgencias','usuarios','emails','auditoria','distribuicoes','receitas','denuncias','repasses','pagamentos','relatorios']) {
      const resposta=await atenderAdministracao({...contexto,caminho:'/api/administracao/painel/lista',requisicao:{url:'/api/administracao/painel/lista?tipo='+tipo+'&busca=teste'}});
      assert.ok(Array.isArray(resposta.resultado.itens));
    }
    const { notificarUrgencia,processarEmails }=require('./notificacoes');
    await transacao(consulta=>notificarUrgencia(consulta,{id:'camp',usuario_id:usuario.id,titulo:'Campanha de teste'},{classe:'critica'},'teste-postgres'));
    assert.equal((await q('SELECT destino FROM avisos')).rows[0].destino,'/urgencia?id=camp');
    await processarEmails({consultar,transacao,enviar:async()=>{const e=Error('Falha simulada');e.code='ECONNECTION';throw e;}});
    assert.equal((await q('SELECT estado FROM email_entregas')).rows[0].estado,'falhou');
    await processarEmails({consultar,transacao,agora:Date.now()+120000,enviar:async()=>({messageId:'postgres-teste'})});
    assert.equal((await q('SELECT estado FROM email_entregas')).rows[0].estado,'enviado');
    const tabelas = await db.query("SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r'");
    assert.ok(tabelas.rows.length > 20);
    assert.ok(tabelas.rows.every(t => t.relrowsecurity));
    await db.exec('SET ROLE anon');
    await assert.rejects(q('SELECT * FROM usuarios'), { code: '42501' });
    await db.exec('RESET ROLE');
  } finally { await db.close(); }
});

test('placeholders preservam interrogação e apóstrofos dentro de texto SQL', () => {
  assert.equal(converterSQL("SELECT 'como? ''sim''' AS texto WHERE id=?"), "SELECT 'como? ''sim''' AS texto WHERE id=$1");
});
