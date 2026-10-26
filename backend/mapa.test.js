const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resumirMapa,descricaoNivel}=require('../src/data/prioridade-mapa.ts');
const geo=[{uf:'SP',nome:'São Paulo',regiao:'Sudeste'},{uf:'SC',nome:'Santa Catarina',regiao:'Sul'},{uf:'PE',nome:'Pernambuco',regiao:'Nordeste'}];
const estado=(uf,restante,classe='regular',revisada=false)=>({uf,criticas:99,moderadas:99,restante:999,intensidade:999,campanhas:[{id:uf,titulo:uf,categoria:'Comunidade',municipio:'',restante,urgencia:{classe,revisada}}]});
test('mapa prioriza revisão real antes de uma lacuna alta e recalcula os agregados',()=>{
  const entrada=[estado('SP',100000000),estado('SC',10000,'critica',true),estado('PE',20000,'moderada',true)];
  const copia=JSON.stringify(entrada),r=resumirMapa(entrada,geo);
  assert.equal(r.regioes[0].nome,'Sul');assert.equal(r.regioes[1].nome,'Nordeste');assert.equal(r.total,3);assert.equal(r.restante,100030000);
  assert.equal(r.ufs[0].nivel,4);assert.equal(r.ufs[1].nivel,3);assert.equal(JSON.stringify(entrada),copia);
});
test('mapa não concede prioridade por declaração, nem interpreta ausência de dados como baixa necessidade',()=>{
  const r=resumirMapa([estado('SP',10000,'critica',false)],geo);
  assert.equal(r.ufs[0].criticas,0);assert.equal(r.ufs[0].nivel,2);
  assert.equal(r.regioes.find(r=>r.nome==='Sul').nivel,0);assert.match(descricaoNivel(0),/Sem campanhas/);
});
test('filtrar doações retira metas alcançadas e objetos; todas as ajudas preserva esses registros',()=>{
  const entrada=[estado('SP',0),estado('SC',5000),estado('XX',9000)];
  assert.equal(resumirMapa(entrada,geo,true).total,1);assert.equal(resumirMapa(entrada,geo,false).total,2);
  assert.equal(resumirMapa([],geo).regioes.length,5);assert.equal(resumirMapa([],geo).total,0);
});
test('prazo só contribui com revisão vigente, sem alterar dinheiro ou dados originais',()=>{
  const agora=Date.parse('2026-10-26T12:00:00Z'),e=estado('SC',10000,'moderada',true);
  e.campanhas[0].urgencia.prazo='2026-10-27';
  const a=resumirMapa([e],geo,true,agora);e.campanhas[0].urgencia.prazo='2026-10-25';const b=resumirMapa([e],geo,true,agora);
  assert.equal(a.ufs[0].intensidade,b.ufs[0].intensidade+1);assert.equal(a.restante,b.restante);
});
