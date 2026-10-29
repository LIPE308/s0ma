const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,writeFileSync,readFileSync,unlinkSync,rmdirSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {normalizarRelatorio,centavosDecimal,importarRelatorio}=require('./publicidade');
const {importar}=require('./importar-google');
test('relatórios publicitários convertem BRL sem misturar estimativa, micros ou outra moeda',()=>{
  assert.equal(centavosDecimal('10.015'),1002);assert.equal(centavosDecimal('-10.015'),-1002);
  assert.deepEqual(normalizarRelatorio('adsense',{headers:[{name:'ESTIMATED_EARNINGS',currencyCode:'BRL'},{name:'IMPRESSIONS'}],totals:{cells:[{value:'123.45'},{value:'1000'}]}}),{moeda:'BRL',estimado_centavos:12345,impressoes:1000});
  assert.throws(()=>normalizarRelatorio('adsense',{headers:[{name:'ESTIMATED_EARNINGS',currencyCode:'USD'}]}),/BRL/);
  const dados=[{header:{localizationSettings:{currencyCode:'BRL'}}},{row:{metricValues:{ESTIMATED_EARNINGS:{microsValue:'123456789'},IMPRESSIONS:{integerValue:'400'}}}},{footer:{matchingRowCount:'1'}}];
  assert.deepEqual(normalizarRelatorio('admob',dados),{moeda:'BRL',estimado_centavos:12346,impressoes:400});
  assert.throws(()=>normalizarRelatorio('admob',[...dados.slice(0,2),{footer:{matchingRowCount:'2'}}]),/truncado/);
});
test('consulta oficial exige credenciais e período válido, sem converter relatório em saldo',async()=>{
  await assert.rejects(importarRelatorio({}, {env:{}}),/Conecte uma conta/);
  const env={PUBLICIDADE_PROVEDOR:'adsense',PUBLICIDADE_CONTA:'pub-1234567890123456',PUBLICIDADE_CLIENT_ID:'id-ficticio',PUBLICIDADE_CLIENT_SECRET:'segredo-ficticio',PUBLICIDADE_REFRESH_TOKEN:'token-ficticio'};
  await assert.rejects(importarRelatorio({inicio:'2026-02-30',fim:'2026-03-01'},{env}),/período válido/);
  let pedido;
  const r=await importarRelatorio({inicio:'2026-01-01',fim:'2026-01-02'},{env,solicitar:async p=>{pedido=p;return{headers:[{name:'ESTIMATED_EARNINGS',currencyCode:'BRL'},{name:'IMPRESSIONS'}],totals:{cells:[{value:'0.35'},{value:'10'}]}};}});
  assert.equal(new URL(pedido.url).hostname,'adsense.googleapis.com');assert.equal(r.estimado_centavos,35);assert.equal('distribuido' in r,false);
});
test('importador OAuth aceita somente cliente Web com retorno autorizado e preserva o MySQL',()=>{
  const pasta=mkdtempSync(join(tmpdir(),'soma-integracoes-')),json=join(pasta,'client.json'),env=join(pasta,'config.env');
  try{
    writeFileSync(env,'MYSQL_BANCO=preservado\nGOOGLE_CLIENT_ID=antigo\n');
    writeFileSync(json,JSON.stringify({installed:{client_id:'invalido'}}));assert.throws(()=>importar(json,env),/Aplicativo Web/);
    writeFileSync(json,JSON.stringify({web:{client_id:'teste.apps.googleusercontent.com',client_secret:'teste-privado',redirect_uris:['http://localhost:3001/api/auth/google/callback']}}));
    importar(json,env);const texto=readFileSync(env,'utf8');assert.match(texto,/MYSQL_BANCO=preservado/);assert.match(texto,/GOOGLE_REDIRECT_URI=/);assert.equal((texto.match(/^GOOGLE_CLIENT_ID=/gm)||[]).length,1);
  }finally{unlinkSync(json);unlinkSync(env);rmdirSync(pasta);}
});
