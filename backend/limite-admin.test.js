const {test}=require('node:test');const assert=require('node:assert/strict');const limite=require('./limite-admin');
test('acesso administrativo limita tentativas e libera após janela ou sucesso',()=>{
 limite.sucesso('admin@exemplo.com');for(let n=0;n<8;n++)limite.tentar('admin@exemplo.com',100000);
 assert.throws(()=>limite.tentar('admin@exemplo.com',100001),e=>e.codigo===429);
 assert.doesNotThrow(()=>limite.tentar('pessoa@example.com',100002));
 assert.doesNotThrow(()=>limite.tentar('admin@exemplo.com',160001));
 limite.sucesso('admin@exemplo.com');assert.doesNotThrow(()=>limite.tentar('admin@exemplo.com',160002));
});
