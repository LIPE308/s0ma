// Inclusão explícita e repetível de exemplos somente no MySQL local.
const { join } = require('node:path');
process.loadEnvFile(join(__dirname, '.env'));
const { gerarSenha } = require('./auxiliares');
const { randomBytes } = require('node:crypto');
const exemplos = [
  ['urgente-01','Alimentos para famílias após as chuvas','Família','Joinville, SC','SC',1800000,428000,'Cestas básicas, água e itens de higiene para famílias acolhidas temporariamente.'],
  ['urgente-02','Um teto seguro depois do incêndio','Família','Blumenau, SC','SC',3200000,965000,'Materiais para recuperar uma moradia e repor os itens essenciais.'],
  ['urgente-03','Cuidado e transporte para o tratamento','Saúde','Campinas, SP','SP',1250000,391000,'Apoio com deslocamentos e alimentação de uma família durante um tratamento.'],
  ['urgente-04','Água potável para a comunidade','Comunidade','Recife, PE','PE',2400000,846000,'Distribuição emergencial de água e instalação de reservatórios comunitários.'],
  ['05','Mochilas para um novo começo','Educação','São Paulo, SP','SP',850000,364000,'Material escolar e mochilas para crianças da comunidade.'],
  ['06','Refeições que acolhem','Alimentação','Curitiba, PR','PR',1600000,1023000,'Compra de alimentos para uma cozinha comunitária.'],
  ['07','Inverno com mais cuidado','Comunidade','Porto Alegre, RS','RS',900000,271000,'Cobertores e roupas de frio para uma ação de acolhimento.'],
  ['08','Livros para descobrir o mundo','Educação','Florianópolis, SC','SC',650000,185000,'Livros, estantes e atividades de leitura em uma biblioteca comunitária.'],
  ['09','Um lar para os animais resgatados','Proteção animal','Campinas, SP','SP',1400000,573000,'Ração, materiais de limpeza e cuidados para animais resgatados.'],
  ['10','Acessibilidade para chegar mais longe','Comunidade','Belo Horizonte, MG','MG',2200000,768000,'Adaptação de acesso ao espaço comunitário e às suas atividades.'],
  ['11','Horta que alimenta o bairro','Meio ambiente','Salvador, BA','BA',750000,219000,'Sementes, ferramentas e estrutura para uma horta coletiva.'],
  ['12','Companhia e cuidado para idosos','Comunidade','Fortaleza, CE','CE',1100000,462000,'Kits de higiene, refeições e organização de visitas voluntárias.'],
].map(item => {
  const historia = require('./historias-campanhas.json')[item[0]];
  return historia ? [item[0],historia.titulo,item[2],historia.regiao || item[3],historia.uf || item[4],item[5],item[6],historia.historia] : item;
});
async function main() {
  const isolado = process.env.SOMA_SEED_ISOLADO === 'soma-temporario' && process.env.MYSQL_HOST === 'banco-soma' && process.env.MYSQL_BANCO === 'soma';
  if (require('./tipo-banco').tipoBanco() !== 'mysql' || (!isolado && !['127.0.0.1','localhost'].includes(process.env.MYSQL_HOST || '127.0.0.1'))) throw Error('Este comando só cadastra exemplos no MySQL local ou no serviço temporário explicitamente autorizado.');
  const { banco, transacao } = require('./banco');
  try {
    let criadas=0;
    await transacao(async q => {
      let [pessoa] = await q('SELECT id FROM usuarios WHERE email=?', ['demonstracao@soma.example']);
      if (!pessoa) {
        const senha=gerarSenha(randomBytes(32).toString('hex'));
        const novo=await q('INSERT INTO usuarios (nome,email,senha_resumo,senha_sal,regiao) VALUES (?,?,?,?,?)',['Comunidade SOMA','demonstracao@soma.example',senha.resumo,senha.sal,'Brasil']);
        pessoa={id:novo.insertId};
      }
      for(const [codigo,titulo,categoria,regiao,uf,meta,recebido,historia] of exemplos) {
        const id='exemplo-'+codigo;
        if ((await q('SELECT id FROM campanhas WHERE id=?',[id])).length) continue;
        const urgente=codigo.startsWith('urgente');
        const prazo=new Date(Date.now()+(urgente?14:60)*86400000).toISOString().slice(0,10);
        await q("INSERT INTO campanhas (id,usuario_id,titulo,descricao,categoria,regiao,prazo,instrucoes,estado) VALUES (?,?,?,?,?,?,?,?,'ativa')",[id,pessoa.id,titulo,historia,categoria,regiao,prazo,'Acompanhe as necessidades e combine a entrega com a organização.']);
        await q("INSERT INTO necessidades (id,campanha_id,nome,tipo,meta,recebido,descricao,prazo) VALUES (?,?,?,'dinheiro',?,?,?,?)",[id+'-valor',id,'Apoio financeiro',meta,recebido,'Recursos para atender às necessidades da campanha.',prazo]);
        await q('INSERT INTO campanhas_detalhes (campanha_id,uf,municipio,mapa_autorizado) VALUES (?,?,?,1)',[id,uf,regiao.split(',')[0]]);
        criadas++;
      }
    });
    console.log(`${criadas} campanhas de exemplo adicionadas; dados anteriores preservados.`);
  } finally { await banco.end(); }
}
if(require.main===module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={exemplos};
