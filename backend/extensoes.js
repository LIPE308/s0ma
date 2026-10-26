const { atenderSoma2 } = require('./soma2');
const { erro } = require('./auxiliares');
// O contrato de leitura anterior usa a mesma fonte contábil da Rota 2.0.
async function atenderExtensoes(ctx) {
  const partes=ctx.caminho.match(/^\/api\/campanhas\/([^/]+)\/inteligencia$/);
  if (partes && ctx.metodo==='GET') {
    const r=(await atenderSoma2({...ctx,caminho:'/api/campanhas/'+partes[1]+'/rota'})).resultado;
    const c=await ctx.obterCampanha(partes[1]);
    const valores=[0,Math.min(20000,r.meta),r.meta*.25,r.meta*.5,r.meta*.75,r.meta].map(Math.round);
    const datas=await ctx.consultar('SELECT chave,alcancado_em FROM marcos_financeiros WHERE campanha_id=?',[c.id]);
    const marcos=valores.map((valor,i)=>({id:'financeiro-'+i,titulo:['Início da jornada','Primeiras contribuições','25% da meta','50% da meta','75% da meta','Objetivo alcançado'][i],valor,concluido:i===0||r.meta>0&&r.confirmado>=valor,data:i===0?c.criada_em:datas.find(d=>d.chave==='financeiro-'+i+':'+valor)?.alcancado_em||null,icone:i===5?'trofeu':'moedas'}));
    marcos.push({id:'anuncios',titulo:'Anúncios conciliados',valor:r.anuncios_creditados,concluido:r.anuncios_creditados>0,data:null,icone:'anuncio'});
    const [d]=await ctx.consultar('SELECT imagem_id,uf,mapa_autorizado FROM campanhas_detalhes WHERE campanha_id=?',[c.id]);
    const publica=['ativa','encerrada'].includes(c.estado);
    return {resultado:{campanha:c.titulo,categoria:c.categoria,estado:c.estado,meta:r.meta,arrecadado:r.confirmado,restante:r.restante,percentual:r.percentual,doacoes:r.doacoes_confirmadas,anuncios:r.anuncios_creditados,rendimentos:0,saldo_disponivel:r.disponivel,marcos,urgencia:{categoria:{regular:'Regular',moderada:'Moderada',critica:'Crítica'}[r.urgencia.classe],verificada:r.urgencia.revisada},uf:d?.mapa_autorizado?d.uf:'',imagem:publica&&d?.imagem_id?'/api/arquivos/'+d.imagem_id+'/imagem':''}};
  }
  if (/^\/api\/(administracao\/solidariedade|perfil\/personalizacao|campanhas\/[^/]+\/(projecao|localizacao|imagem))/.test(ctx.caminho)) erro('Este fluxo foi atualizado. Abra Preparar publicação, Personalizar perfil ou Fundo solidário no aplicativo atualizado.',410);
  return null;
}
module.exports={atenderExtensoes};
