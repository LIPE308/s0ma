const { OAuth2Client } = require('google-auth-library');
const { erro } = require('./auxiliares');

function configuracaoPublicidade(env = process.env) {
  const provedor = env.PUBLICIDADE_PROVEDOR || '', conta = env.PUBLICIDADE_CONTA || '';
  return { provedor, conta, configurado: ['adsense','admob'].includes(provedor) && /^pub-\d{16}$/.test(conta) && Boolean(env.PUBLICIDADE_CLIENT_ID && env.PUBLICIDADE_CLIENT_SECRET && env.PUBLICIDADE_REFRESH_TOKEN), estimativas_apenas: true };
}
function centavosDecimal(valor) {
  const texto = String(valor);
  if (!/^-?\d+(\.\d+)?$/.test(texto)) erro('O provedor retornou um valor monetário inválido.',502);
  const negativo = texto.startsWith('-'), [inteiro,fracao=''] = texto.replace('-','').split('.');
  const n = (BigInt(inteiro)*100n+BigInt((fracao+'00').slice(0,2))+(Number(fracao[2]||0)>=5?1n:0n))*(negativo?-1n:1n);
  if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)) erro('Valor fora do limite do relatório.',502);
  return Number(n);
}
function normalizarRelatorio(provedor, dados) {
  if (provedor === 'adsense') {
    const headers = dados.headers || [], cells = dados.totals?.cells || [];
    const ganho = headers.findIndex(h=>h.name==='ESTIMATED_EARNINGS'), imp = headers.findIndex(h=>h.name==='IMPRESSIONS');
    if (ganho < 0 || headers[ganho].currencyCode !== 'BRL') erro('O relatório precisa retornar receita em BRL.',502);
    const impressoes = Number(cells[imp]?.value || 0);
    if (!Number.isSafeInteger(impressoes) || impressoes < 0) erro('Impressões inválidas no relatório.',502);
    return { moeda: 'BRL', estimado_centavos: centavosDecimal(cells[ganho]?.value || '0'), impressoes };
  }
  if (!Array.isArray(dados)) erro('Resposta AdMob inválida.',502);
  const header = dados.find(x=>x.header)?.header, footer = dados.find(x=>x.footer)?.footer;
  if (header?.localizationSettings?.currencyCode !== 'BRL') erro('O relatório precisa retornar receita em BRL.',502);
  if (!footer || footer.warnings?.length) erro('O AdMob retornou um relatório incompleto ou com avisos. Confira na conta do provedor.',502);
  let micros = 0n, impressoes = 0;
  const linhas = dados.filter(x=>x.row);
  if (Number(footer.matchingRowCount || 0) > linhas.length) erro('Relatório truncado. Use um período menor.',502);
  for (const {row} of linhas) {
    const v = row.metricValues || {};
    if (!/^-?\d+$/.test(v.ESTIMATED_EARNINGS?.microsValue || '0')) erro('Receita AdMob inválida.',502);
    micros += BigInt(v.ESTIMATED_EARNINGS?.microsValue || '0');
    impressoes += Number(v.IMPRESSIONS?.integerValue || 0);
  }
  const cents = (micros < 0n ? -1n : 1n)*((micros < 0n ? -micros : micros)+5000n)/10000n;
  if (!Number.isSafeInteger(impressoes) || impressoes < 0 || cents>BigInt(Number.MAX_SAFE_INTEGER) || cents<BigInt(Number.MIN_SAFE_INTEGER)) erro('Valores AdMob fora do limite.',502);
  return { moeda:'BRL', estimado_centavos:Number(cents), impressoes };
}
async function importarRelatorio(dados, {env=process.env, solicitar} = {}) {
  const config = configuracaoPublicidade(env);
  if (!config.configurado) erro('Conecte uma conta AdSense ou AdMob com credenciais OAuth de relatórios no servidor.',409);
  const {inicio,fim} = dados;
  const valido = d => typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0,10)===d;
  if (!valido(inicio) || !valido(fim) || inicio>fim || fim>new Date().toISOString().slice(0,10) || (Date.parse(fim)-Date.parse(inicio))/86400000>366) erro('Informe um período válido, de até 366 dias, sem datas futuras.');
  const cliente = new OAuth2Client(env.PUBLICIDADE_CLIENT_ID,env.PUBLICIDADE_CLIENT_SECRET);
  cliente.setCredentials({ refresh_token:env.PUBLICIDADE_REFRESH_TOKEN });
  const pedir = solicitar || (opcoes=>cliente.request({...opcoes,timeout:20000}).then(r=>r.data));
  const data = d => { const [year,month,day]=d.split('-').map(Number); return {year,month,day}; };
  let resposta;
  try {
    if (config.provedor==='adsense') {
      const url = new URL('https://adsense.googleapis.com/v2/accounts/'+config.conta+'/reports:generate');
      url.searchParams.set('dateRange','CUSTOM'); url.searchParams.set('currencyCode','BRL');
      for (const [chave,d] of [['startDate',inicio],['endDate',fim]]) for (const [parte,valor] of Object.entries(data(d))) url.searchParams.set(chave+'.'+parte,String(valor));
      url.searchParams.append('metrics','ESTIMATED_EARNINGS'); url.searchParams.append('metrics','IMPRESSIONS');
      resposta = await pedir({ url:url.href,method:'GET' });
    } else resposta = await pedir({ url:'https://admob.googleapis.com/v1/accounts/'+config.conta+'/networkReport:generate',method:'POST',data:{ reportSpec:{ dateRange:{ startDate:data(inicio),endDate:data(fim) },metrics:['ESTIMATED_EARNINGS','IMPRESSIONS'],localizationSettings:{currencyCode:'BRL',languageCode:'pt-BR'},maxReportRows:1000 } } });
  } catch { erro('Não foi possível consultar o provedor. Confira autorização, conta e API habilitada no Google Cloud.',502); }
  return { provedor:config.provedor,conta:config.conta,inicio,fim,...normalizarRelatorio(config.provedor,resposta) };
}
module.exports = { configuracaoPublicidade, normalizarRelatorio, centavosDecimal, importarRelatorio };
