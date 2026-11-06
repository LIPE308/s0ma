const {test}=require('node:test');
const assert=require('node:assert/strict');
const {urgentesPrimeiro}=require('./ordem-campanhas');
const c=(id,classe='regular',revisada=false,estado='ativa')=>({id,estado,urgencia:{classe,revisada}});
test('todas as críticas revisadas precedem emergentes, moderadas e regulares, sem intercalar',()=>{
 const lista=[c('normal'),c('critica-b','critica',true),c('exemplo-urgente-01'),c('moderada','moderada',true),c('critica-a','critica',true)];
 const antes=JSON.stringify(lista);
 assert.deepEqual(urgentesPrimeiro(lista).map(c=>c.id),['critica-b','critica-a','exemplo-urgente-01','moderada','normal']);
 assert.equal(JSON.stringify(lista),antes);
});
test('declaração sem revisão não sobe e campanhas encerradas ficam no final',()=>{
 assert.deepEqual(urgentesPrimeiro([c('encerrada','critica',true,'encerrada'),c('normal'),c('nao-revisada','critica')]).map(c=>c.id),['normal','nao-revisada','encerrada']);
});
