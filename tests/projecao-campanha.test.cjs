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
 assert.equal(new Set(ids.map((id,index)=>projetarCampanha(id,[428000,965000,391000,846000,364000,1023000,271000,185000,573000,768000,219000,462000][index],3200000,4,id.startsWith('exemplo-urgente-')).total)).size,12);
 assert.deepEqual(projetarCampanha('a',0,10000,3),projetarCampanha('a',0,10000,3));
});
test('cada uma das 12 campanhas possui foto com conteúdo diferente',()=>{
 const files=readdirSync('assets/photos/campanhas').filter(f=>f.endsWith('.jpg'));
 assert.equal(files.length,12);
 const hashes=files.map(f=>createHash('sha256').update(readFileSync('assets/photos/campanhas/'+f)).digest('hex'));
 assert.equal(new Set(hashes).size,12);
});

const {permiteAnuncios}=require('../src/servicos/campanhas-exemplos.ts');
test('anúncios só entram na projeção quando permitidos',()=>{
 assert.equal(projetarCampanha('comum',0,100000,10).anuncios,0);
 assert.equal(projetarCampanha('comum',0,100000,10,false).anuncios,0);
 assert.ok(projetarCampanha('emergente',0,100000,10,true).anuncios>0);
});
test('apenas emergências ativas revisadas ou casos emergenciais de apresentação recebem apoio',()=>{
 assert.equal(permiteAnuncios({id:'normal',estado:'ativa',urgencia:{classe:'regular',revisada:false}}),false);
 assert.equal(permiteAnuncios({id:'pendente',estado:'ativa',urgencia:{classe:'critica',revisada:false}}),false);
 assert.equal(permiteAnuncios({id:'critica',estado:'ativa',urgencia:{classe:'critica',revisada:true}}),true);
 assert.equal(permiteAnuncios({id:'exemplo-urgente-01',estado:'ativa'}),true);
 assert.equal(permiteAnuncios({id:'exemplo-05',estado:'ativa'}),false);
 assert.equal(permiteAnuncios({id:'exemplo-urgente-01',estado:'encerrada'}),false);
});
