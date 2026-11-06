const {erro}=require('./auxiliares');
let janela={inicio:0,total:0};
function tentar(email,agora=Date.now()){
 if(email!=='admin@exemplo.com')return;
 if(agora-janela.inicio>=60000)janela={inicio:agora,total:0};
 if(++janela.total>8)erro('Muitas tentativas. Aguarde um minuto para tentar novamente.',429);
}
function sucesso(email){if(email==='admin@exemplo.com')janela={inicio:0,total:0};}
module.exports={tentar,sucesso};
