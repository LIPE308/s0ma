const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ordenarPrioridade, prioridadeCampanha } = require('../src/servicos/campanhas-exemplos.ts');
const campanha = (id,urgencia={classe:'regular',revisada:false}) => ({id,urgencia});
test('urgências revisadas precedem emergências fictícias sem alterar a lista original',()=>{
 const lista=[campanha('comum'),campanha('exemplo-urgente-01'),campanha('real',{classe:'critica',revisada:true})];
 assert.deepEqual(ordenarPrioridade(lista).map(c=>c.id),['real','exemplo-urgente-01','comum']);
 assert.equal(lista[0].id,'comum');
 assert.equal(lista[1].urgencia.revisada,false);
});
test('pedido crítico sem revisão não recebe prioridade de urgência confirmada',()=>{
 assert.equal(prioridadeCampanha(campanha('pedido',{classe:'critica',revisada:false})),0);
});
test('mantém a ordem relativa de campanhas com a mesma prioridade',()=>{
 const lista=[campanha('b'),campanha('a')];
 assert.deepEqual(ordenarPrioridade(lista).map(c=>c.id),['b','a']);
});
