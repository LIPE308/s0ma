const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lerData, escreverData, diasDoMes } = require('../src/data/calendario.ts');
const { fotoGoogleSegura } = require('./experiencia');
const {tokenDaRequisicao,gravarCookieSessao}=require('./sessao-web');

test('foto Google só aceita HTTPS do domínio oficial sem aceitar domínios parecidos',()=>{
  assert.equal(fotoGoogleSegura('https://lh3.googleusercontent.com/a/foto'),'https://lh3.googleusercontent.com/a/foto');
  for(const u of ['http://lh3.googleusercontent.com/a','https://googleusercontent.com.example/foto','https://example.com/?googleusercontent.com','javascript:alert(1)',null,'x'.repeat(601)])assert.equal(fotoGoogleSegura(u),null);
});
test('cookie não sobrepõe Bearer explícito e mantém segurança e cookies existentes',()=>{
  const token='a'.repeat(64),req={headers:{cookie:'outra=1; soma_sessao='+token},socket:{encrypted:true}};
  assert.equal(tokenDaRequisicao(req),token);assert.equal(tokenDaRequisicao({...req,headers:{...req.headers,authorization:'Basic invalido'}}),'');
  const headers={'Set-Cookie':['oauth=1']},res={getHeader:n=>headers[n],setHeader:(n,v)=>headers[n]=v};gravarCookieSessao(req,res,token);
  assert.equal(headers['Set-Cookie'][0],'oauth=1');assert.match(headers['Set-Cookie'][1],/HttpOnly; SameSite=Lax; Max-Age=86400; Secure/);
});
test('calendário brasileiro valida dias, meses e anos bissextos sem normalizar datas inválidas', () => {
  assert.equal(lerData('31/04/2026'), null); assert.equal(lerData('29/02/2026'), null);
  assert.equal(lerData('01/13/2026'), null); assert.equal(lerData(''), null);
  assert.equal(escreverData(lerData('29/02/2028')), '29/02/2028');
  assert.equal(diasDoMes(2028, 1).filter(Boolean).length, 29);
  assert.equal(diasDoMes(2026, 9).filter(Boolean).length, 31);
  assert.equal(diasDoMes(2026, 9)[4], 1);
});
