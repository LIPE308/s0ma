const {test}=require('node:test');
const assert=require('node:assert/strict');
const {adicionarRota}=require('./rota-caddy.cjs');
test('somente /soma é acrescentado, sem mudar regras do site',()=>{
 const anterior={apps:{http:{servers:{srv0:{routes:[{match:[{host:['korvy.com.br']}],handle:[{handler:'subroute',routes:[{handle:[{handler:'reverse_proxy',upstreams:[{dial:'app:3000'}]}]}]}]},{match:[{host:['www.korvy.com.br']}],handle:[{handler:'static_response',status_code:308}]}]}}}}};
 const original=structuredClone(anterior),depois=adicionarRota(anterior);
 const lista=depois.apps.http.servers.srv0.routes[0].handle[0].routes;
 const soma=lista.shift();
 assert.deepEqual(soma.match,[{path:['/soma','/soma/*']}]);
 assert.equal(soma.terminal,true);
 assert.deepEqual(depois,original);
 assert.equal(soma.handle[0].response.set['X-Robots-Tag'][0],'noindex, nofollow, noarchive');
});
test('formato desconhecido aborta e repetir configuração não duplica a rota',()=>{
 assert.throws(()=>adicionarRota({}));
 const c={apps:{http:{servers:{s:{routes:[{match:[{host:['korvy.com.br']}],handle:[{handler:'subroute',routes:[]}]}]}}}}};
 adicionarRota(c);adicionarRota(c);assert.equal(c.apps.http.servers.s.routes[0].handle[0].routes.length,1);
});
test('cookie fica restrito à API do SOMA quando hospedado em subrota',()=>{
 const {gravarCookieSessao}=require('../../backend/sessao-web');
 const old=process.env.APP_BASE_PATH;process.env.APP_BASE_PATH='/soma';
 try{let valor;gravarCookieSessao({socket:{}},{getHeader:()=>undefined,setHeader:(_,v)=>{valor=v;}},'a'.repeat(64));assert.match(valor[0],/Path=\/soma\/api;/);}
 finally{if(old===undefined)delete process.env.APP_BASE_PATH;else process.env.APP_BASE_PATH=old;}
});
test('conexão temporária exige HTTPS e Host/TLS correspondentes ao túnel',()=>{
 const c={apps:{http:{servers:{s:{routes:[{match:[{host:['korvy.com.br']}],handle:[{handler:'subroute',routes:[]}]}]}}}}};
 const r=adicionarRota(c,'https://teste.trycloudflare.com').apps.http.servers.s.routes[0].handle[0].routes[0];
 const proxy=r.handle[2];assert.equal(proxy.upstreams[0].dial,'teste.trycloudflare.com:443');
 assert.equal(proxy.transport.tls.server_name,'teste.trycloudflare.com');
 assert.deepEqual(proxy.headers.request.set.Host,['teste.trycloudflare.com']);
 for(const invalid of ['http://teste.trycloudflare.com','https://127.0.0.1','https://teste.trycloudflare.com.evil.example','https://teste.trycloudflare.com/api','https://a:b@teste.trycloudflare.com'])assert.throws(()=>adicionarRota(c,invalid));
});
