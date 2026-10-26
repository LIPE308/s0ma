const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// Nenhum DROP, reset ou reescrita de contas: tabelas extras podem permanecer num rollback de código.
async function migrarSoma2(consultar, banco, transacao) {
  const esquema = readFileSync(join(__dirname, 'esquema-soma2.sql'), 'utf8');
  for (const comando of esquema.split(';').filter(item => item.trim())) await banco.query(comando);
  // A main anterior também usava perfis: acrescentar campos sem perder foto/capa/biografia.
  const colunas = await consultar('SHOW COLUMNS FROM perfis');
  const adicionais = { nome_instituicao:"VARCHAR(150) NOT NULL DEFAULT ''", adulto:'BOOLEAN DEFAULT NULL', publico:'BOOLEAN NOT NULL DEFAULT FALSE', local_publico:'BOOLEAN NOT NULL DEFAULT FALSE', apoios_publicos:'BOOLEAN NOT NULL DEFAULT FALSE', cor:"ENUM('royal','verde','terracota') NOT NULL DEFAULT 'royal'", avatar_id:'VARCHAR(36)', capa_id:'VARCHAR(36)' };
  for (const [campo,tipo] of Object.entries(adicionais)) if (!colunas.some(c=>c.Field===campo)) await banco.query('ALTER TABLE perfis ADD COLUMN '+campo+' '+tipo);
  if (colunas.find(c=>c.Field==='biografia')?.Type==='varchar(500)') await banco.query("ALTER TABLE perfis MODIFY biografia VARCHAR(1200) NOT NULL DEFAULT ''");
  await transacao(async consulta => {
    await consulta("INSERT IGNORE INTO soma_migracoes (chave) VALUES ('002-lancamentos-em-andamento')");
    const [marcador] = await consulta("SELECT chave FROM soma_migracoes WHERE chave='002-lancamentos-em-andamento' FOR UPDATE");
    if (!marcador) throw new Error('Migração não disponível.');
    const [aplicada] = await consulta("SELECT chave FROM soma_migracoes WHERE chave='002-lancamentos'");
    if (aplicada) return;
    // Reconcilia o saldo preexistente sem inventar datas históricas ou recebimentos novos.
    await consulta("INSERT INTO lancamentos (campanha_id,necessidade_id,origem,referencia,valor) SELECT n.campanha_id,n.id,'saldo_legado',CONCAT('legado:',n.id),n.recebido-COALESCE((SELECT SUM(p.valor_liquido) FROM pagamentos p WHERE p.necessidade_id=n.id AND p.estado='confirmado'),0) FROM necessidades n WHERE n.tipo='dinheiro' AND n.recebido<>COALESCE((SELECT SUM(p.valor_liquido) FROM pagamentos p WHERE p.necessidade_id=n.id AND p.estado='confirmado'),0)");
    await consulta("INSERT INTO lancamentos (campanha_id,necessidade_id,origem,referencia,valor) SELECT n.campanha_id,n.id,'doacao',CONCAT('pagamento:',p.id,':confirmado'),p.valor_liquido FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id WHERE p.estado='confirmado'");
    await consulta("INSERT INTO lancamentos (campanha_id,origem,referencia,valor) SELECT campanha_id,'repasse',CONCAT('repasse:',id,':concluido'),-valor FROM repasses WHERE estado='concluido'");
    await consulta("INSERT INTO soma_migracoes (chave) VALUES ('002-lancamentos')");
  });
  await require('./migrar-compatibilidade').migrarCompatibilidade(consultar,transacao);
}
module.exports = { migrarSoma2 };
