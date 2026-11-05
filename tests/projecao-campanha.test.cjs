const {test}=require('node:test');
const assert=require('node:assert/strict');
const {projetarCampanha}=require('../src/servicos/projecao-campanha.ts');
const {createHash}=require('node:crypto');
const {readFileSync,readdirSync}=require('node:fs');
test('projeção usa saldo e meta da campanha, com soma e percentual coerentes',()=>{
 const p=projetarCampanha('uma-campanha',428000,1800000,4);
 assert.equal(p.total,p.base+p.doacoes+p.anuncios+p.rendimento);
 assert.equal(p.base,428000);assert.equal(p.meta,1800000);
 assert.equal(p.percentual,p.total/1800000*100);
 assert.equal(p.restante,1800000-p.total);
});
test('metas alteradas refletem no percentual e o progresso não ultrapassa 100%',()=>{
 assert.equal(projetarCampanha('a',50000,10000,5).percentual,100);
 assert.equal(projetarCampanha('a',50000,10000,5).restante,0);
 assert.equal(projetarCampanha('a',0,0,5).percentual,0);
 assert.ok(projetarCampanha('a',5000,20000,5).percentual<projetarCampanha('a',5000,10000,5).percentual);
});
test('projeção individual é estável e diferente nas 12 campanhas',()=>{
 const ids=['exemplo-urgente-01','exemplo-urgente-02','exemplo-urgente-03','exemplo-urgente-04',...['05','06','07','08','09','10','11','12'].map(i=>'exemplo-'+i)];
 assert.equal(new Set(ids.map(id=>projetarCampanha(id,10000,100000,3).total)).size,12);
 assert.deepEqual(projetarCampanha('a',0,10000,3),projetarCampanha('a',0,10000,3));
});
test('cada uma das 12 campanhas possui foto com conteúdo diferente',()=>{
 const files=readdirSync('assets/photos/campanhas').filter(f=>f.endsWith('.jpg'));
 assert.equal(files.length,12);
 const hashes=files.map(f=>createHash('sha256').update(readFileSync('assets/photos/campanhas/'+f)).digest('hex'));
 assert.equal(new Set(hashes).size,12);
});
