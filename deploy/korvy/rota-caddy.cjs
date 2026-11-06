// Recebe JSON do Caddy pelo stdin; preserva todos os handlers anteriores.
const fs = require('node:fs');
function adicionarRota(config, origem) {
  let proxy = {handler:'reverse_proxy',upstreams:[{dial:'soma-temporario:3001'}]};
  if (origem) {
    const url = new URL(origem);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Origem do túnel inválida');
    proxy = {handler:'reverse_proxy',upstreams:[{dial:url.hostname+':443'}],transport:{protocol:'http',tls:{server_name:url.hostname}},headers:{request:{set:{Host:[url.hostname]}}}};
  }
  let encontrados = 0;
  for (const server of Object.values(config.apps?.http?.servers || {})) {
    for (const route of server.routes || []) {
      if (!route.match?.some(m => m.host?.includes('korvy.com.br'))) continue;
      const routes = route.handle?.find(h => h.handler === 'subroute')?.routes;
      if (!routes) throw Error('Estrutura de rotas inesperada');
      const existente = routes.findIndex(r => r['@id'] === 'soma-temporario');
      if (existente >= 0) routes.splice(existente, 1);
      routes.unshift({ '@id':'soma-temporario', match:[{path:['/soma','/soma/*']}], terminal:true, handle:[
        {handler:'headers',response:{set:{'X-Robots-Tag':['noindex, nofollow, noarchive']}}},
        {handler:'rewrite',strip_path_prefix:'/soma'},
        proxy
      ]});
      encontrados++;
    }
  }
  if (encontrados !== 1) throw Error('Não foi encontrada uma única rota korvy.com.br');
  return config;
}
module.exports = { adicionarRota };
if (require.main === module) process.stdout.write(JSON.stringify(adicionarRota(JSON.parse(fs.readFileSync(0,'utf8')), process.argv[2])));
