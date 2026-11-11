const {test}=require('node:test');const assert=require('node:assert/strict');const {mascararDinheiro}=require('../src/data/dinheiro.ts');
test('máscara monetária filtra texto, formata centavos e milhares',()=>{
 assert.equal(mascararDinheiro('abc'),'');assert.equal(mascararDinheiro('abc20,00'),'20,00');assert.equal(mascararDinheiro('R$ 1.234,56'),'1.234,56');assert.equal(mascararDinheiro('1'),'0,01');assert.equal(mascararDinheiro(''),'');assert.equal(mascararDinheiro('0002000'),'20,00');
});