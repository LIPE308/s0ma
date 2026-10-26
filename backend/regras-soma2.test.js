const {test}=require('node:test');
const assert=require('node:assert/strict');
const {avaliarUrgencia,urgenciaPublica,dataISO}=require('./urgencia');
const {distribuirFundo,dividirReceita}=require('./distribuicao');
const {criarProjecao,estimarCadencia}=require('./projecao');
const {prepararArquivo}=require('./midias');
const agora=new Date('2026-10-22T12:00:00Z');
const pedido={natureza:'vida',consequencias:'Risco grave com necessidade imediata de ajuda.',prazo_limite:'2026-10-24',recursos_disponiveis:0};
test('urgência: recomendação não é prioridade e pesos não usam popularidade',()=>{
  const a=avaliarUrgencia(pedido,100000,0,agora),b=avaliarUrgencia({...pedido,seguidores:999999,visualizacoes:999999},10000000,0,agora);
  assert.equal(a.pontos,80);assert.equal(a.recomendacao,'critica');assert.equal(a.pontos,b.pontos);
  assert.equal(urgenciaPublica({...pedido,classe:'critica',estado:'pendente'},agora).classe,'regular');
  assert.equal(urgenciaPublica({...pedido,classe:'critica',estado:'revisada',revisado_por:2,evidencia_verificada:1,evidencia_valida_ate:'2026-10-24'},agora).classe,'critica');
});
test('urgência: documento, prazo e validade vencidos não concedem destaque',()=>{
  for(const mudanca of [{evidencia_verificada:0},{evidencia_valida_ate:'2026-10-21'},{prazo_limite:'2026-10-21'},{estado:'recurso'}]){
    assert.equal(urgenciaPublica({...pedido,classe:'critica',estado:'revisada',revisado_por:2,evidencia_verificada:1,evidencia_valida_ate:'2026-10-24',...mudanca},agora).classe,'regular');
  }
  assert.equal(dataISO('2026-02-30'),null);
  assert.equal(avaliarUrgencia({...pedido,prazo_limite:'2026-10-21'},10000,0,agora).recomendacao,'regular');
});
test('fundo: divisão exata em centavos, custos não arbitrários e sem valor negativo',()=>{
  assert.deepEqual(dividirReceita(10001,1000,1),{bruto:10001,tributos:1000,custos:1,liquido:9000,fundo:6300,operacao:2700});
  assert.throws(()=>dividirReceita(100,80,30));
});
const candidatas=()=>[{id:'a',usuario_id:1,dias:1,meta:100000,falta:100000,anterior:0},{id:'b',usuario_id:2,dias:3,meta:100000,falta:60000,anterior:10000},{id:'c',usuario_id:3,dias:10,meta:100000,falta:50000,anterior:0},{id:'d',usuario_id:4,dias:10,meta:100000,falta:20000,anterior:50000}];
test('fundo: proporcional, determinístico, sem concentração e com soma conservada',()=>{
  const a=distribuirFundo(70000,candidatas()),b=distribuirFundo(70000,candidatas().reverse());
  assert.deepEqual(a,b);
  assert.equal(a.retido+a.alocacoes.reduce((s,c)=>s+c.valor,0),70000);
  assert.ok(a.alocacoes.every(c=>c.valor<=24500&&c.valor<=c.falta&&Number.isInteger(c.valor)));
  assert.ok(new Set(a.alocacoes.map(c=>c.valor)).size>1);
});
test('fundo: campanha duplicada por responsável não aumenta sua fatia',()=>{
  const c=candidatas();c.push({...c[0],id:'duplicada'});
  const a=distribuirFundo(70000,c);
  assert.equal(a.alocacoes.filter(c=>c.usuario_id===1).length,1);
  assert.ok(a.alocacoes.filter(c=>c.usuario_id===1).reduce((s,c)=>s+c.valor,0)<=24500);
});
test('fundo: ausência de elegíveis, meta atingida e único destinatário retêm saldo',()=>{
  assert.equal(distribuirFundo(10000,[]).retido,10000);
  assert.equal(distribuirFundo(10000,[{...candidatas()[0],falta:0}]).retido,10000);
  assert.equal(distribuirFundo(10000,[candidatas()[0]]).retido,6500);
  assert.equal(distribuirFundo(1,[candidatas()[0]]).retido,1);
});
test('projeção: pouco histórico é indisponível, nunca rendimento inventado',()=>{
  const r=criarProjecao({doacoes:[],anuncios:[],restante:10000,urgencia:{classe:'regular'},disponivel:10000},{},agora);
  assert.equal(r.doacoes,null);assert.equal(r.anuncios,null);assert.equal(r.dias_para_meta,null);assert.equal(r.rendimento_estimado,null);
});
test('projeção: cadência exige dias distintos e explicita hipótese',()=>{
  const entradas=[{valor:10000,criado_em:'2026-10-10T12:00:00Z'},{valor:10000,criado_em:'2026-10-15T12:00:00Z'},{valor:10000,criado_em:'2026-10-20T12:00:00Z'}];
  assert.equal(estimarCadencia(entradas,agora).mensal,75000);
  assert.equal(estimarCadencia(entradas.map(r=>({...r,criado_em:'2026-10-10T12:00:00Z'})),agora),null);
  assert.match(estimarCadencia(entradas,agora).hipotese,/não são garantidas/);
});
test('cenário educativo: liquidez crítica prevalece e dados inválidos são rejeitados',()=>{
  const base={doacoes:[],anuncios:[],restante:10000,urgencia:{classe:'critica',prazo:'2026-10-24'},disponivel:10000};
  assert.equal(criarProjecao(base,{taxa_mensal:1,dias:30,custos:0},agora).educativa.bloqueada,true);
  const r=criarProjecao({...base,urgencia:{classe:'regular'}},{taxa_mensal:1,dias:30,custos:0},agora);
  assert.equal(r.educativa.resultado,100);assert.match(r.educativa.hipotese,/sem produto indicado/);
  assert.throws(()=>criarProjecao(base,{taxa_mensal:100,dias:1,custos:0},agora));
});
test('arquivos: conteúdo ativo, disfarces e excesso de tamanho são recusados',()=>{
  for(const texto of ['<svg onload=alert(1)>','<html>documento</html>','%PDF-1.7 sem final'])assert.throws(()=>prepararArquivo(Buffer.from(texto).toString('base64'),'documento'));
  assert.throws(()=>prepararArquivo(Buffer.alloc(2*1024*1024+1).toString('base64'),'documento'));
  const pdf=Buffer.from('%PDF-1.4\nDocumento privado de teste\n%%EOF').toString('base64');
  assert.equal(prepararArquivo(pdf,'documento').mime,'application/pdf');assert.throws(()=>prepararArquivo(pdf,'avatar'));
});

test('projeção: encerramento suspende entradas e prazo insuficiente gera alerta',()=>{
  const base={doacoes:[{valor:10000,criado_em:'2026-10-10T12:00:00Z'},{valor:10000,criado_em:'2026-10-15T12:00:00Z'},{valor:10000,criado_em:'2026-10-20T12:00:00Z'}],anuncios:[],restante:100000,urgencia:{classe:'critica',prazo:'2026-10-24'},disponivel:10000};
  assert.match(criarProjecao(base,{},agora).alerta_prazo,/não alcançaria/);
  const r=criarProjecao({...base,estado:'encerrada'},{},agora);
  assert.equal(r.doacoes,null);assert.equal(r.dias_para_meta,null);assert.match(r.mensagem,/suspensas/);
});
test('arquivos: PNG aceito, metadados removidos e dimensões abusivas recusadas',()=>{
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=','base64');
  const texto=Buffer.alloc(16);texto.writeUInt32BE(4);texto.write('tEXt',4);texto.write('GPS!',8);
  const seguro=prepararArquivo(Buffer.concat([png.subarray(0,33),texto,png.subarray(33)]).toString('base64'),'avatar');
  assert.equal(seguro.mime,'image/png');assert.equal(seguro.conteudo.includes(Buffer.from('GPS!')),false);
  const enorme=Buffer.from(png);enorme.writeUInt32BE(10001,16);
  assert.throws(()=>prepararArquivo(enorme.toString('base64'),'avatar'),/megapixels/);
});

test('arquivos: fotografia JPEG do projeto continua válida após retirar metadados',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const foto=fs.readFileSync(path.join(__dirname,'..','assets','photos','comunidade-unsplash.jpg'));
  const seguro=prepararArquivo(foto.toString('base64'),'campanha');assert.equal(seguro.mime,'image/jpeg');assert.ok(seguro.conteudo.length<=foto.length);
});
