const {test}=require('node:test');const assert=require('node:assert/strict');
const indicadoresSociais=require('../src/data/indicadores-sociais.json');
const historias=require('../backend/historias-campanhas.json');
test('indicadores têm referência, fonte, cinco regiões e cobertura exata das 27 UFs',()=>{
 assert.equal(indicadoresSociais.referencia,2024);assert.equal(indicadoresSociais.regioes.length,5);
 const ufs=indicadoresSociais.regioes.flatMap(r=>r.ufs);assert.equal(ufs.length,27);assert.equal(new Set(ufs).size,27);
 assert.ok(indicadoresSociais.fonte.startsWith('https://agenciabrasil.ebc.com.br/'));
 for(const r of indicadoresSociais.regioes){assert.ok(r.extremaPobreza<=r.pobreza);assert.ok(r.pobreza<=100);}
});
test('valores regionais preservam o recorte publicado, sem taxas estaduais inventadas',()=>{
 assert.deepEqual(indicadoresSociais.regioes.map(r=>[r.nome,r.pobreza,r.extremaPobreza]),[['Nordeste',39.4,6.5],['Norte',35.9,4.6],['Sudeste',15.6,2.3],['Centro-Oeste',15.4,1.6],['Sul',11.2,1.5]]);
 assert.equal(indicadoresSociais.brasil.pobreza,23.1);
 assert.ok(indicadoresSociais.regioes.every(r=>!('taxasEstaduais' in r)));
});
test('12 causas têm referência e localização consistente no Norte e Nordeste',()=>{
 const lista=Object.values(historias);assert.equal(lista.length,12);
 assert.equal(lista.filter(c=>indicadoresSociais.regioes.find(r=>r.ufs.includes(c.uf)).nome==='Nordeste').length,10);
 assert.equal(lista.filter(c=>indicadoresSociais.regioes.find(r=>r.ufs.includes(c.uf)).nome==='Norte').length,2);
 for(const c of lista){assert.equal(c.referencia,2024);assert.ok(c.fonte.startsWith('https://'));assert.ok(c.regiao.endsWith(c.uf));assert.ok(c.historia.includes('2024'));}
});
