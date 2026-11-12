// Modelo de potencial de apoio; não gera receita conciliada nem créditos.
function projetarApoioAtividade(visualizacoes,compartilhamentos){
 const inteiro=v=>Math.min(100000000,Math.max(0,Math.floor(Number(v)||0)));
 const visitas=inteiro(visualizacoes),convites=inteiro(compartilhamentos);
 const liquido_estimado=visitas+convites*2;
 const fundo_estimado=Math.floor(liquido_estimado*70/100);
 return {liquido_estimado,fundo_estimado,operacao_estimada:liquido_estimado-fundo_estimado,visualizacoes:visitas,compartilhamentos:convites};
}
module.exports={projetarApoioAtividade};