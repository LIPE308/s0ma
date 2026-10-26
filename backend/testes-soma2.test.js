// SOMA 2.0: jornadas sem aprovações implícitas, num MySQL descartável separado.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const {once}=require('node:events');
const mysql=require('mysql2/promise');
const nomeBanco='soma_teste_2_'+process.pid+'_'+Date.now();
const config={host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORTA||3306),user:process.env.MYSQL_TESTE_USUARIO||'root',password:process.env.MYSQL_TESTE_SENHA??'raiz_local_123'};
const env={...process.env,MYSQL_HOST:config.host,MYSQL_PORTA:String(config.port),MYSQL_USUARIO:config.user,MYSQL_SENHA:config.password,MYSQL_BANCO:nomeBanco,PORTA:'0',ENDERECO:'127.0.0.1',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',GOOGLE_REDIRECT_URI:''};
let db,servidor,url,erros='';
async function iniciar(){
  servidor=spawn(process.execPath,['backend/servidor.js'],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Servidor não iniciou: '+erros)),30000);servidor.stdout.on('data',d=>{const m=String(d).match(/porta (\d+)/);if(m){url='http://127.0.0.1:'+m[1]+'/api';clearTimeout(t);resolve();}});servidor.stderr.on('data',d=>erros+=d);servidor.once('error',reject);servidor.once('exit',c=>{clearTimeout(t);reject(Error('Servidor encerrou '+c+': '+erros));});});
}
async function parar(){if(servidor&&servidor.exitCode===null){const fim=once(servidor,'exit');servidor.kill();await fim;}}
async function chamar(path,{method='GET',body,token,status=200,key}={}){
  const r=await fetch(url+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const d=await r.json();assert.equal(r.status,status,method+' '+path+' '+JSON.stringify(d)+' '+(r.status>=500?erros:''));return d;
}
const data=(dias)=>new Date(Date.now()+dias*86400000).toISOString().slice(0,10);
const perfil=(extra={})=>({tipo:'pessoa',adulto:true,publico:false,local_publico:false,apoios_publicos:false,biografia:'Perfil fictício de integração',...extra});
const necessidade=(nome,meta=100000)=>({nome,tipo:'dinheiro',meta,descricao:'Somente simulação acadêmica',tipo_meta:'fechada'});
const campanha=(titulo,necessidades=[necessidade('Materiais')])=>({titulo,descricao:'Campanha fictícia para testar a jornada completa do SOMA 2.0.',categoria:'Saúde',regiao:'Região de teste',prazo:'',necessidades});
const pdf=Buffer.from('%PDF-1.4\nEvidência privada fictícia, somente testes\n%%EOF').toString('base64');
test('SOMA 2.0: revisão, urgência, anúncios, rota, mapa, perfil e privacidade',{timeout:120000},async suite=>{
  let a,b,c,d,admin,rascunho,arquivo,campB,campC,duplicada,receita;
  try{
    db=await mysql.createConnection(config);await db.query('CREATE DATABASE '+nomeBanco+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');await iniciar();
    async function conta(email,nome){await chamar('/cadastro',{method:'POST',body:{nome,email,senha:'SenhaTeste_2026!'},status:201});const s=await chamar('/login',{method:'POST',body:{email,senha:'SenhaTeste_2026!'}});await chamar('/perfil-ampliado',{method:'PUT',token:s.token,body:perfil()});return s;}
    a=await conta('a@teste.example','Responsável A');b=await conta('b@teste.example','Responsável B');c=await conta('c@teste.example','Responsável C');d=await conta('d@teste.example','Doador D');admin=await conta('operador@teste.example','Operador');
    execFileSync(process.execPath,['backend/configurar-admin.js','operador@teste.example'],{env,stdio:'pipe'});
    admin=await chamar('/login',{method:'POST',body:{email:'operador@teste.example',senha:'SenhaTeste_2026!'}});
    async function aprovar(camp,pessoa){await chamar('/campanhas/'+camp.id+'/enviar',{method:'POST',token:pessoa.token});await chamar('/administracao/campanhas/'+camp.id,{method:'PATCH',token:admin.token,body:{estado:'ativa',motivo:'Revisão humana da fixture de teste'}});}
    async function tornarCritica(camp,pessoa,dias=3){
      await chamar('/arquivos',{method:'POST',token:pessoa.token,body:{campanha_id:camp.id,finalidade:'documento',nome:'evidencia.pdf',base64:pdf},status:201});
      await chamar('/campanhas/'+camp.id+'/urgencia',{method:'POST',token:pessoa.token,body:{natureza:'vida',consequencias:'Necessidade imediata declarada e revisada apenas como fixture de teste.',prazo_limite:data(dias),recursos_disponiveis:0},status:201});
      await chamar('/administracao/urgencias/'+camp.id,{method:'PATCH',token:admin.token,body:{classe:'critica',validade:data(dias),evidencia_verificada:true,justificativa:'Documento fictício revisado exclusivamente para este teste.'}});
    }
    await suite.test('rascunho não é público; envio, maioridade e aprovação têm permissões reais',async()=>{
      rascunho=await chamar('/campanhas',{method:'POST',token:a.token,body:campanha('Rota da campanha A'),status:201});
      assert.equal(rascunho.estado,'rascunho');
      await chamar('/campanhas/'+rascunho.id,{status:404});
      await chamar('/campanhas/'+rascunho.id+'/enviar',{method:'POST',status:401});
      await chamar('/campanhas/'+rascunho.id+'/enviar',{method:'POST',token:d.token,status:403});
      await chamar('/administracao/campanhas/'+rascunho.id,{method:'PATCH',token:a.token,body:{estado:'ativa',motivo:'Elevação indevida'},status:403});
      await chamar('/administracao/campanhas/'+rascunho.id,{method:'PATCH',token:admin.token,body:{estado:'ativa',motivo:'Ainda não enviada'},status:409});
      await chamar('/perfil-ampliado',{method:'PUT',token:a.token,body:perfil({adulto:false})});
      await chamar('/campanhas/'+rascunho.id+'/enviar',{method:'POST',token:a.token,status:409});
      await chamar('/perfil-ampliado',{method:'PUT',token:a.token,body:perfil()});
      assert.ok(!(await chamar('/descoberta')).some(x=>x.id===rascunho.id));
    });
    await suite.test('documentos privados e assinaturas de arquivo: terceiro não lê nem publica',async()=>{
      await chamar('/arquivos',{method:'POST',token:a.token,body:{campanha_id:rascunho.id,finalidade:'documento',nome:'falso.pdf',base64:Buffer.from('<html>falso</html>').toString('base64')},status:400});
      arquivo=await chamar('/arquivos',{method:'POST',token:a.token,body:{campanha_id:rascunho.id,finalidade:'documento',nome:'evidencia.pdf',base64:pdf,publico:true},status:201});
      await chamar('/arquivos/'+arquivo.id,{status:401});await chamar('/arquivos/'+arquivo.id,{token:d.token,status:403});await chamar('/arquivos/'+arquivo.id+'/imagem',{status:404});
      assert.equal((await chamar('/arquivos/'+arquivo.id,{token:admin.token})).mime,'application/pdf');
      await chamar('/campanhas/'+rascunho.id+'/arquivos',{token:d.token,status:403});
    });
    await suite.test('urgência: indicação do autor não vira prioridade; evidência insuficiente é rejeitada',async()=>{
      await chamar('/campanhas/'+rascunho.id+'/urgencia',{method:'POST',token:a.token,body:{natureza:'vida',consequencias:'Necessidade imediata com consequência relevante descrita para o teste.',prazo_limite:data(-1),recursos_disponiveis:0},status:400});
      const pedido=await chamar('/campanhas/'+rascunho.id+'/urgencia',{method:'POST',token:a.token,body:{natureza:'vida',consequencias:'Necessidade imediata com consequência relevante descrita para o teste.',prazo_limite:data(2),recursos_disponiveis:0,classe:'critica',evidencia_verificada:true},status:201});
      assert.equal(pedido.recomendacao.recomendacao,'critica');
      assert.equal((await chamar('/campanhas/'+rascunho.id+'/urgencia',{token:a.token})).publica.classe,'regular');
      await chamar('/administracao/urgencias/'+rascunho.id,{method:'PATCH',token:d.token,body:{classe:'critica'},status:403});
      await chamar('/administracao/urgencias/'+rascunho.id,{method:'PATCH',token:admin.token,body:{classe:'critica',validade:data(3),evidencia_verificada:false,justificativa:'Não há evidência validada para esta decisão.'},status:409});
      await chamar('/administracao/urgencias/'+rascunho.id,{method:'PATCH',token:admin.token,body:{classe:'critica',validade:data(2),evidencia_verificada:true,justificativa:'Evidência privada da fixture examinada e aprovada.'}});
      await aprovar(rascunho,a);
      assert.equal((await chamar('/campanhas/'+rascunho.id)).urgencia.classe,'critica');
      const json=JSON.stringify(await chamar('/campanhas/'+rascunho.id));assert.ok(!json.includes('consequencias'));assert.ok(!json.includes('evidencia.pdf'));
    });
    await suite.test('mapa usa consentimento e UF; filtros e contagem não expõem endereço',async()=>{
      assert.ok(!(await chamar('/mapa')).estados.some(e=>e.campanhas.some(c=>c.id===rascunho.id)));
      await chamar('/campanhas/'+rascunho.id+'/contexto',{method:'PUT',token:a.token,body:{mapa_autorizado:true,uf:'SC',municipio:'Rua Secreta 123'},status:400});
      await chamar('/campanhas/'+rascunho.id+'/contexto',{method:'PUT',token:a.token,body:{mapa_autorizado:true,uf:'SC',municipio:'Florianópolis'}});
      const sc=(await chamar('/mapa')).estados.find(e=>e.uf==='SC');assert.equal(sc.criticas,1);assert.equal(sc.campanhas.length,1);assert.ok(sc.intensidade>0);
      assert.equal((await chamar('/descoberta?uf=SC&urgencia=critica&categoria=Sa%C3%BAde')).length,1);
      assert.equal((await chamar('/descoberta?uf=SC&categoria=Educa%C3%A7%C3%A3o')).length,0);
      await chamar('/descoberta?min=nan',{status:400});
      await chamar('/campanhas/'+rascunho.id+'/visualizacao',{method:'POST'});
      assert.equal((await chamar('/campanhas/'+rascunho.id)).visualizacoes,1);
    });
    await suite.test('duplicatas por responsável não publicam múltiplas cópias; urgências mantêm histórico',async()=>{
      await chamar('/campanhas',{method:'POST',token:a.token,body:campanha('Rota da campanha A'),status:409});
      campB=await chamar('/campanhas',{method:'POST',token:b.token,body:campanha('Campanha B'),status:201});await tornarCritica(campB,b,3);await aprovar(campB,b);
      campC=await chamar('/campanhas',{method:'POST',token:c.token,body:campanha('Campanha C',[necessidade('Tratamento',60000),necessidade('Materiais',40000)]),status:201});await tornarCritica(campC,c,5);await aprovar(campC,c);
      duplicada=await chamar('/campanhas',{method:'POST',token:a.token,body:campanha('Outra campanha do mesmo responsável'),status:201});await tornarCritica(duplicada,a,1);await aprovar(duplicada,a);
      await chamar('/campanhas/'+campB.id+'/urgencia/recurso',{method:'POST',token:b.token,body:{motivo:'Recurso de teste para nova análise.'},status:201});
      assert.equal((await chamar('/campanhas/'+campB.id)).urgencia.classe,'regular');
      await chamar('/administracao/urgencias/'+campB.id,{method:'PATCH',token:admin.token,body:{classe:'critica',validade:data(3),evidencia_verificada:true,justificativa:'Nova análise após recurso com evidência vigente.'}});
      assert.equal((await chamar('/campanhas/'+campB.id+'/urgencia',{token:b.token})).historico.filter(h=>h.acao==='decisao').length,2);
    });
    await suite.test('receita pendente não dá crédito; conciliação e distribuição são exclusivas da administração',async()=>{
      await chamar('/administracao/receitas',{method:'POST',token:a.token,body:{bruto:100000},status:403});
      await chamar('/administracao/receitas',{method:'POST',token:admin.token,body:{bruto:1000,tributos:1000,custos:1,referencia:'invalida',justificativa:'Teste'},status:400});
      receita=await chamar('/administracao/receitas',{method:'POST',token:admin.token,body:{bruto:100000,tributos:10000,custos:10000,referencia:'conciliacao-unica',justificativa:'Dados demonstrativos; tributos e custos registrados.',modo:'simulado'},status:201,key:'receita-simulada-2026'});
      assert.equal(receita.estado,'pendente');
      await chamar('/administracao/receitas/'+receita.id+'/distribuir',{method:'POST',token:admin.token,status:409});
      assert.equal((await chamar('/campanhas/'+rascunho.id+'/rota')).anuncios_creditados,0);
      await chamar('/administracao/receitas/'+receita.id+'/confirmar',{method:'POST',token:admin.token,body:{conciliacao_confirmada:false},status:400});
      await chamar('/administracao/receitas/'+receita.id+'/confirmar',{method:'POST',token:admin.token,body:{conciliacao_confirmada:true}});
    });
    await suite.test('distribuição concorrente: 70/30, proporcional, teto por responsável e nenhum duplo crédito',async()=>{
      const distribuir=()=>chamar('/administracao/receitas/'+receita.id+'/distribuir',{method:'POST',token:admin.token,body:{},key:'distribuir-receita-unica-2026'});
      const [x,y]=await Promise.all([distribuir(),distribuir()]);assert.deepEqual(x,y);
      assert.equal(x.fundo,56000);assert.equal(x.operacao,24000);
      assert.equal(x.distribuido+x.retido,56000);assert.ok(x.campanhas.every(c=>c.valor<=19600));
      const [porDono]=await db.query('SELECT c.usuario_id,SUM(d.valor) AS total,COUNT(DISTINCT c.id) AS campanhas FROM '+nomeBanco+'.distribuicoes d JOIN '+nomeBanco+'.campanhas c ON c.id=d.campanha_id GROUP BY c.usuario_id');
      assert.ok(porDono.every(d=>d.total<=19600 && d.campanhas===1));
      const [sum]=await db.query("SELECT SUM(valor) AS total FROM "+nomeBanco+".lancamentos WHERE origem='anuncio'");assert.equal(Number(sum[0].total),x.distribuido);
      await chamar('/administracao/receitas/'+receita.id+'/distribuir',{method:'POST',token:admin.token,body:{},status:409});
      const rota=await chamar('/campanhas/'+campB.id+'/rota');assert.ok(rota.anuncios_creditados>0);assert.equal(rota.confirmado,rota.anuncios_creditados);assert.equal(rota.marcos.find(m=>m.id==='anuncios').concluido,true);assert.equal(rota.projecao.doacoes,null);assert.equal(rota.aplicado,0);
      const educativa=await chamar('/campanhas/'+campB.id+'/rota?taxa_mensal=1&dias=30&custos=0');assert.equal(educativa.projecao.educativa.bloqueada,true);
    });
    await suite.test('progresso independente, confirmação e lançamentos; projeções exigem histórico suficiente',async()=>{
      const n=campC.necessidades[0],outro=campC.necessidades[1],antes=await chamar('/campanhas/'+campC.id+'/rota'),outroAntes=antes.necessidades.find(x=>x.id===outro.id).recebido;
      for(let i=0;i<3;i++){
        const p=await chamar('/pagamentos',{method:'POST',token:d.token,body:{necessidade_id:n.id,valor:1000,meio:'Pix'},status:201});
        await chamar('/pagamentos/'+p.id+'/simular',{method:'PATCH',token:d.token,body:{estado:'confirmado'}});
        await chamar('/pagamentos/'+p.id+'/simular',{method:'PATCH',token:d.token,body:{estado:'confirmado'}});
        await db.query('UPDATE '+nomeBanco+'.pagamentos SET criado_em=DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? DAY) WHERE id=?',[12-i*3,p.id]);
      }
      const rota=await chamar('/campanhas/'+campC.id+'/rota');assert.equal(rota.doacoes_confirmadas,3000);assert.equal(rota.confirmado,antes.confirmado+3000);assert.equal(rota.necessidades.find(x=>x.id===outro.id).recebido,outroAntes);assert.ok(rota.projecao.doacoes);assert.ok(rota.projecao.dias_para_meta>0);
      const [sum]=await db.query('SELECT SUM(valor) AS total FROM '+nomeBanco+'.lancamentos WHERE campanha_id=?',[campC.id]);assert.equal(Number(sum[0].total),rota.confirmado);
    });
    await suite.test('perfil institucional e privacidade: menor não publica dados ou recebe papel administrativo',async()=>{
      await chamar('/perfis/'+d.usuario.id,{status:404});
      await chamar('/perfil-ampliado',{method:'PUT',token:d.token,body:perfil({tipo:'instituicao',nome_instituicao:'Instituição fictícia',publico:true,local_publico:true,apoios_publicos:true,administrador:true})});
      const p=await chamar('/perfis/'+d.usuario.id);assert.equal(p.tipo,'instituicao');assert.equal(p.email,undefined);assert.equal(p.telefone,undefined);assert.equal((await chamar('/perfil',{token:d.token})).administrador,false);
      await chamar('/perfil-ampliado',{method:'PUT',token:d.token,body:perfil({adulto:false,publico:true,local_publico:true,apoios_publicos:true})});
      await chamar('/perfis/'+d.usuario.id,{status:404});
      const privado=await chamar('/perfil-ampliado',{token:d.token});assert.equal(privado.publico,0);assert.equal(privado.local_publico,0);
      await chamar('/administracao/soma2',{token:d.token,status:403});
    });
    await suite.test('moderação e mudanças materiais retiram prioridade; fundo sem elegíveis permanece retido',async()=>{
      const atual=await chamar('/campanhas/'+rascunho.id,{token:a.token});
      const alterada=await chamar('/campanhas/'+rascunho.id,{method:'PUT',token:a.token,body:{...atual,descricao:'História materialmente alterada para testar nova revisão.'}});
      assert.equal(alterada.estado,'rascunho');await chamar('/campanhas/'+rascunho.id,{status:404});
      assert.equal((await chamar('/campanhas/'+rascunho.id+'/urgencia',{token:a.token})).publica.classe,'regular');
      for(const camp of [campB,campC,duplicada])await chamar('/administracao/campanhas/'+camp.id,{method:'PATCH',token:admin.token,body:{estado:'suspensa',motivo:'Suspensão da fixture para testar fundo sem elegíveis.'}});
      const nova=await chamar('/administracao/receitas',{method:'POST',token:admin.token,body:{bruto:10000,referencia:'sem-elegiveis',justificativa:'Receita simulada sem campanha apta.'},status:201});
      await chamar('/administracao/receitas/'+nova.id+'/confirmar',{method:'POST',token:admin.token,body:{conciliacao_confirmada:true}});
      await chamar('/administracao/receitas/'+nova.id+'/distribuir',{method:'POST',token:admin.token,body:{},status:409});
      const painel=await chamar('/administracao/soma2',{token:admin.token});assert.equal(painel.receitas.find(r=>r.id===nova.id).estado,'confirmada');assert.equal(painel.receitas.find(r=>r.id===nova.id).distribuido,0);assert.ok(painel.auditoria.some(a=>a.acao==='arquivo_consultado'));assert.ok(painel.auditoria.some(a=>a.acao==='anuncio_simulado_creditado'));
    });
    await suite.test('trocar imagem pública exige revisão e mantém os bytes privados até aprovação',async()=>{
      const camp=await chamar('/campanhas',{method:'POST',token:b.token,body:campanha('Revisão de foto publicada'),status:201});await aprovar(camp,b);
      const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=';
      const foto=await chamar('/arquivos',{method:'POST',token:b.token,body:{campanha_id:camp.id,finalidade:'campanha',nome:'foto.png',consentimento:true,base64:png},status:201});
      await chamar('/campanhas/'+camp.id,{status:404});await chamar('/arquivos/'+foto.id+'/imagem',{status:404});
      assert.equal((await chamar('/arquivos/'+foto.id,{token:b.token})).mime,'image/png');await aprovar(camp,b);
      const imagem=await fetch(url+'/arquivos/'+foto.id+'/imagem');assert.equal(imagem.status,200);assert.equal(imagem.headers.get('content-type'),'image/png');
    });
    await suite.test('criação simplificada preserva foto e UF atomicamente, reenvio único e rota privada',async()=>{
      const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=';
      const corpo={...campanha('Criar em três passos'),prazo:'',regiao:'',imagem:png,uf:'SC'};
      const enviar=()=>chamar('/campanhas',{method:'POST',token:b.token,body:corpo,key:'criacao-simples-unica',status:201});const [a1,a2]=await Promise.all([enviar(),enviar()]);assert.equal(a1.id,a2.id);assert.equal(a1.regiao,'');
      await chamar('/campanhas/'+a1.id+'/inteligencia',{status:404});const rota=await chamar('/campanhas/'+a1.id+'/inteligencia',{token:b.token});assert.equal(rota.estado,'rascunho');assert.equal(rota.imagem,'');assert.equal(rota.meta,100000);
      const arquivos=await chamar('/campanhas/'+a1.id+'/arquivos',{token:b.token});assert.equal(arquivos.length,1);
      await chamar('/campanhas',{method:'POST',token:b.token,body:{...corpo,titulo:'UF inválida não salva',uf:'ZZ'},status:400});await chamar('/campanhas',{method:'POST',token:b.token,body:{...corpo,titulo:'Imagem inválida não salva',imagem:'data:image/png;base64,aW52YWxpZG8='},status:400});
      const minhas=await chamar('/campanhas?minhas=1',{token:b.token});assert.ok(!minhas.some(c=>c.titulo==='UF inválida não salva'||c.titulo==='Imagem inválida não salva'));
      await chamar('/administracao/solidariedade/simular',{method:'POST',token:admin.token,body:{valor:10000,referencia:'atalho-invalido'},status:410});
    });
    await suite.test('Google sem credenciais não inventa autenticação; ausência de sessão segue protegida',async()=>{
      assert.equal((await chamar('/configuracao')).google,false);
      await chamar('/auth/google/iniciar',{status:503});await chamar('/auth/google/trocar',{method:'POST',status:503});
      await chamar('/perfil-ampliado',{status:401});await chamar('/administracao/soma2',{status:401});
    });
    await suite.test('reinício mantém migração, ledger, arquivos e distribuições sem repetir créditos',async()=>{
      const [antes]=await db.query('SELECT COUNT(*) AS total,SUM(valor) AS valor FROM '+nomeBanco+'.lancamentos');
      await parar();await iniciar();
      const [depois]=await db.query('SELECT COUNT(*) AS total,SUM(valor) AS valor FROM '+nomeBanco+'.lancamentos');assert.deepEqual(depois,antes);
      const [m]=await db.query("SELECT chave FROM "+nomeBanco+".soma_migracoes WHERE chave='002-lancamentos'");assert.equal(m.length,1);
      assert.equal((await chamar('/arquivos/'+arquivo.id,{token:a.token})).base64,pdf);
      const f=await chamar('/fundo');assert.equal(f.simulado,true);assert.ok(f.distribuido>0);assert.ok(f.retido>=7000);
    });
  }finally{await parar();if(db){assert.match(nomeBanco,/^soma_teste_2_\d+_\d+$/);await db.query('DROP DATABASE '+nomeBanco);await db.end();}}
});
