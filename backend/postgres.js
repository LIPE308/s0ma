const { Pool, types } = require('pg');
const { readFileSync } = require('node:fs');

// Preserve the existing API's numeric aggregates, JSON text and UTC dates.
types.setTypeParser(20, valor => {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero)) throw new RangeError('Inteiro fora do limite seguro.');
  return numero;
});
types.setTypeParser(1700, Number);
types.setTypeParser(114, valor => valor);
types.setTypeParser(1082, valor => valor);
types.setTypeParser(1114, valor => new Date(valor.replace(' ', 'T') + 'Z'));

const chaves = {
  perfis: 'usuario_id', campanhas_detalhes: 'campanha_id', urgencias: 'campanha_id',
  operacoes: 'usuario_id,chave',
};

// Only translates the small SQL dialect used by the existing backend.
// Quoted values are protected, including question marks inside text.
function converterSQL(sql) {
  const literais = [];
  let texto = sql.replace(/'(?:''|[^'])*'/g, valor => `__literal_${literais.push(valor) - 1}__`);
  let indice = 0;
  texto = texto.replace(/\?/g, () => '$' + (++indice));
  texto = texto.replace(/UTC_DATE\(\)/gi, "(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date");
  const ignorar = /^\s*INSERT IGNORE INTO /i.test(texto);
  texto = texto.replace(/INSERT IGNORE INTO /i, 'INSERT INTO ');
  const duplicata = texto.match(/ON DUPLICATE KEY UPDATE (.+)$/is);
  if (duplicata) {
    const tabela = texto.match(/INSERT INTO (\w+)/i)[1];
    if (!chaves[tabela]) throw new Error('Upsert sem chave PostgreSQL: ' + tabela);
    let atualizacao = duplicata[1].replace(/VALUES\((\w+)\)/gi, 'EXCLUDED.$1');
    atualizacao = atualizacao.replace(/(?<=[=,+\s(])(foto_google|visualizacoes|chave)(?!\s*=)(?=\b)/g, tabela + '.$1');
    texto = texto.slice(0, duplicata.index) + `ON CONFLICT (${chaves[tabela]}) DO UPDATE SET ` + atualizacao;
  } else if (ignorar) texto += ' ON CONFLICT DO NOTHING';
  // RETURNING keeps insertId and affectedRows available to existing handlers.
  if (/^\s*INSERT INTO /i.test(texto)) texto += ' RETURNING *';
  return texto.replace(/__literal_(\d+)__/g, (_, i) => literais[Number(i)]);
}

function criarBancoPostgres() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no backend/.env para conectar ao Supabase.');
  const url = new URL(process.env.DATABASE_URL);
  // Prevent connection-string options from overriding certificate verification.
  for (const chave of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(chave);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const pool = new Pool({
    connectionString: url.toString(), max: 5, connectionTimeoutMillis: 15000,
    options: '-c timezone=UTC',
    ssl: local ? false : { rejectUnauthorized: true, ...(process.env.PGSSLROOTCERT ? { ca: readFileSync(process.env.PGSSLROOTCERT, 'utf8') } : {}) },
  });
  async function executar(cliente, comando, valores = []) {
    try {
      const resultado = await cliente.query(converterSQL(comando), valores);
      return [/^(SELECT|WITH)\b/i.test(comando.trim()) ? resultado.rows : {
        affectedRows: resultado.rowCount, insertId: resultado.rows[0]?.id,
      }];
    } catch (erro) {
      erro.code = ({ '23505': 'ER_DUP_ENTRY', '23503': 'ER_ROW_IS_REFERENCED_2', '40P01': 'ER_LOCK_DEADLOCK', '40001': 'ER_LOCK_DEADLOCK' })[erro.code] || erro.code;
      throw erro;
    }
  }
  return {
    postgres: true,
    execute: (sql, valores) => executar(pool, sql, valores),
    query: (sql, valores) => executar(pool, sql, valores),
    end: () => pool.end(),
    async getConnection() {
      const cliente = await pool.connect();
      return {
        query: (sql, valores) => executar(cliente, sql, valores),
        execute: (sql, valores) => executar(cliente, sql, valores),
        beginTransaction: () => cliente.query('BEGIN ISOLATION LEVEL READ COMMITTED'),
        commit: () => cliente.query('COMMIT'), rollback: () => cliente.query('ROLLBACK'),
        release: () => cliente.release(),
      };
    },
  };
}
module.exports = { criarBancoPostgres, converterSQL };
