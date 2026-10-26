const { randomUUID, randomBytes, createHash } = require('node:crypto');
const { erro, texto, inteiro, opcao, usuarioPublico } = require('./auxiliares');
const { avaliarUrgencia, urgenciaPublica, dataISO, diasAte, naturezas } = require('./urgencia');
const { distribuirFundo, dividirReceita } = require('./distribuicao');
const { criarProjecao } = require('./projecao');
const { prepararArquivo, nomeSeguro } = require('./midias');
const { umaVez } = require('./operacoes');
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
function json(valor) { return typeof valor === 'string' ? JSON.parse(valor) : valor; }
async function auditar(consulta, usuarioId, campanhaId, acao, dados = {}) {
  await consulta('INSERT INTO auditoria (usuario_id,campanha_id,acao,dados) VALUES (?,?,?,?)', [usuarioId || null, campanhaId || null, acao, JSON.stringify(dados)]);
}
async function lancar(consulta, campanhaId, necessidadeId, origem, referencia, valor) {
  await consulta('INSERT INTO lancamentos (campanha_id,necessidade_id,origem,referencia,valor) VALUES (?,?,?,?,?)', [campanhaId, necessidadeId || null, origem, referencia, valor]);
}
async function completarCampanhas(consulta, campanhas) {
  if (!campanhas.length) return [];
  const ids = campanhas.map(c => c.id), marcas = ids.map(() => '?').join(',');
  const [detalhes, urgencias, metas, perfis] = await Promise.all([
    consulta('SELECT * FROM campanhas_detalhes WHERE campanha_id IN (' + marcas + ')', ids),
    consulta('SELECT * FROM urgencias WHERE campanha_id IN (' + marcas + ')', ids),
    consulta("SELECT campanha_id,SUM(meta) AS meta,SUM(recebido) AS recebido FROM necessidades WHERE tipo='dinheiro' AND campanha_id IN (" + marcas + ') GROUP BY campanha_id', ids),
    consulta('SELECT usuario_id,publico,adulto FROM perfis WHERE usuario_id IN ('+marcas+')',campanhas.map(c=>c.usuario_id)),
  ]);
  const mapaD = new Map(detalhes.map(d => [d.campanha_id, d])), mapaU = new Map(urgencias.map(u => [u.campanha_id, u])), mapaM = new Map(metas.map(m => [m.campanha_id, m]));
  return campanhas.map(c => {
    const d = mapaD.get(c.id), m = mapaM.get(c.id);
    return { ...c, perfil_publico:perfis.some(p=>p.usuario_id===c.usuario_id&&p.publico&&p.adulto), uf: d?.mapa_autorizado ? d.uf : '', municipio: d?.mapa_autorizado ? d.municipio : '', mapa_autorizado: Boolean(d?.mapa_autorizado), imagem_id: d?.imagem_id || null, visualizacoes: d?.visualizacoes || 0, submetida: Boolean(d?.submetida), urgencia: urgenciaPublica(mapaU.get(c.id)), meta_financeira: Number(m?.meta || 0), recebido_financeiro: Number(m?.recebido || 0) };
  });
}
function ordenarFeed(campanhas) {
  const novas = [...campanhas].sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em) || a.id.localeCompare(b.id));
  const criticas = novas.filter(c => c.urgencia.classe === 'critica');
  const regulares = novas.filter(c => c.urgencia.classe !== 'critica');
  const poucoVistas = [...regulares].sort((a, b) => a.visualizacoes - b.visualizacoes || new Date(b.criada_em) - new Date(a.criada_em));
  const resultado = [], usados = new Set(); let passo = 0;
  while (resultado.length < campanhas.length) {
    const fila = passo % 3 === 0 ? criticas : passo % 3 === 1 ? regulares : poucoVistas;
    const item = fila.find(c => !usados.has(c.id)) || novas.find(c => !usados.has(c.id));
    if (!item) break;
    usados.add(item.id); resultado.push(item); passo++;
  }
  return resultado;
}
async function revisarPublicacao(consulta, campanha, usuario) {
  const [perfil] = await consulta('SELECT adulto FROM perfis WHERE usuario_id=?', [campanha.usuario_id]);
  if (perfil && perfil.adulto === 0) erro('O responsável precisa declarar maioridade no perfil antes da publicação.', 409);
  if (campanha.estado !== 'rascunho') return;
  const [detalhes] = await consulta('SELECT submetida FROM campanhas_detalhes WHERE campanha_id=?', [campanha.id]);
  if (!detalhes?.submetida) erro('A campanha ainda precisa ser enviada para análise pelo responsável.', 409);
  if (!perfil?.adulto) erro('O responsável precisa declarar maioridade no perfil antes da publicação.', 409);
}
async function marcarEdicao(consulta, campanha, usuarioId) {
  if (campanha.estado === 'suspensa' || campanha.estado === 'ajustes') {
    await consulta("UPDATE urgencias SET estado='pendente',evidencia_verificada=0 WHERE campanha_id=?", [campanha.id]);
    await auditar(consulta,usuarioId,campanha.id,'edicao_oculta_para_revisao');
    return;
  }
  const anterior = campanha.estado === 'encerrada' ? 'encerrada' : 'ativa';
  await consulta("UPDATE campanhas SET estado='rascunho',estado_antes_moderacao=? WHERE id=?", [anterior, campanha.id]);
  await consulta('INSERT INTO campanhas_detalhes (campanha_id,submetida) VALUES (?,0) ON DUPLICATE KEY UPDATE submetida=0', [campanha.id]);
  await consulta("UPDATE urgencias SET estado='pendente',evidencia_verificada=0 WHERE campanha_id=?", [campanha.id]);
  await auditar(consulta, usuarioId, campanha.id, 'edicao_para_revisao', { estado_anterior: campanha.estado });
}
async function atenderSoma2(ctx) {
  const { caminho, metodo, usuario, dados, requisicao, resposta, consultar, transacao, obterCampanha, exigirLogin, exigirAdministrador, exigirResponsavel, conferirVisibilidade, calcularSaldo } = ctx;
  const ok = (resultado, codigo = 200) => ({ resultado, codigo });
  let partes;
  if (caminho === '/api/configuracao' && metodo === 'GET') return ok({ financeiro: 'simulado', publicidade: 'simulada', google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI), google_plataforma: 'web', ufs: UFS });
  if (caminho === '/api/perfil-ampliado') {
    exigirLogin(usuario);
    if (metodo === 'GET') {
      await consultar('INSERT IGNORE INTO perfis (usuario_id) VALUES (?)', [usuario.id]);
      const [perfil] = await consultar('SELECT * FROM perfis WHERE usuario_id=?', [usuario.id]);
      const [ajudas, campanhas, doacoes] = await Promise.all([
        consultar("SELECT COUNT(*) AS total FROM ajudas WHERE usuario_id=? AND recebido>0", [usuario.id]),
        consultar('SELECT COUNT(*) AS total FROM campanhas WHERE usuario_id=?', [usuario.id]),
        consultar("SELECT COUNT(*) AS total FROM pagamentos WHERE usuario_id=? AND estado='confirmado'", [usuario.id]),
      ]);
      return ok({ ...usuarioPublico(usuario), ...perfil, conquistas: { ajudas_confirmadas: ajudas[0].total, campanhas_criadas: campanhas[0].total, doacoes_simuladas: doacoes[0].total } });
    }
    if (metodo === 'PUT') {
      const tipo = opcao(dados.tipo || 'pessoa', ['pessoa','instituicao'], 'tipo de perfil');
      if (typeof dados.adulto !== 'boolean') erro('Declare se você é maior de 18 anos.');
      for (const campo of ['publico','local_publico','apoios_publicos']) if (typeof dados[campo] !== 'boolean') erro('Informe as preferências de privacidade.');
      const publico = dados.adulto && dados.publico;
      const biografia = texto(dados.biografia || '', 'a biografia', 1200, false), instituicao = texto(dados.nome_instituicao || '', 'o nome da instituição', 150, tipo === 'instituicao');
      const cor = opcao(dados.cor || 'royal', ['royal','verde','terracota'], 'cor');
      const midias = {};
      for (const campo of ['avatar_id','capa_id']) {
        const id = dados[campo] || null;
        if (id) {
          const [arquivo] = await consultar('SELECT usuario_id,finalidade FROM arquivos WHERE id=?', [id]);
          if (!arquivo || arquivo.usuario_id !== usuario.id || arquivo.finalidade !== (campo === 'avatar_id' ? 'avatar' : 'capa')) erro('Selecione uma imagem do seu próprio perfil.', 403);
        }
        midias[campo] = id;
      }
      await transacao(async consulta => {
        await consulta('INSERT INTO perfis (usuario_id,tipo,biografia,nome_instituicao,adulto,publico,local_publico,apoios_publicos,cor,avatar_id,capa_id) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tipo=VALUES(tipo),biografia=VALUES(biografia),nome_instituicao=VALUES(nome_instituicao),adulto=VALUES(adulto),publico=VALUES(publico),local_publico=VALUES(local_publico),apoios_publicos=VALUES(apoios_publicos),cor=VALUES(cor),avatar_id=VALUES(avatar_id),capa_id=VALUES(capa_id)', [usuario.id,tipo,biografia,instituicao,Number(dados.adulto),Number(publico),Number(publico && dados.local_publico),Number(publico && dados.apoios_publicos),cor,midias.avatar_id,midias.capa_id]);
        await auditar(consulta, usuario.id, null, 'perfil_atualizado', { tipo, publico });
        if (!dados.adulto) {
          await consulta("UPDATE campanhas SET estado='rascunho',estado_antes_moderacao='ativa' WHERE usuario_id=? AND estado='ativa'",[usuario.id]);
          await consulta("UPDATE urgencias u JOIN campanhas c ON c.id=u.campanha_id SET u.estado='pendente',u.evidencia_verificada=0 WHERE c.usuario_id=?",[usuario.id]);
        }
      });
      return ok({ mensagem: dados.adulto ? 'Perfil salvo.' : 'Perfil salvo em modo privado para proteger menores de idade.' });
    }
  }
  if ((partes = caminho.match(/^\/api\/perfis\/(\d+)$/)) && metodo === 'GET') {
    const id = Number(partes[1]), proprio = usuario?.id === id || usuario?.administrador;
    const [perfil] = await consultar('SELECT p.*,u.nome,u.regiao FROM perfis p JOIN usuarios u ON u.id=p.usuario_id WHERE p.usuario_id=?', [id]);
    if (!perfil || (!proprio && (!perfil.publico || !perfil.adulto))) erro('Perfil não disponível.', 404);
    const campanhas = await consultar("SELECT id,titulo,estado FROM campanhas WHERE usuario_id=? AND estado IN ('ativa','encerrada')", [id]);
    const apoios = perfil.apoios_publicos && perfil.adulto ? await consultar("SELECT DISTINCT c.id,c.titulo FROM campanhas c JOIN pagamentos p ON p.necessidade_id IN (SELECT id FROM necessidades WHERE campanha_id=c.id) WHERE p.usuario_id=? AND p.estado='confirmado' AND c.estado IN ('ativa','encerrada')", [id]) : [];
    return ok({ usuario_id: id, nome: perfil.nome, tipo: perfil.tipo, nome_instituicao: perfil.nome_instituicao, biografia: perfil.adulto ? perfil.biografia : '', regiao: perfil.local_publico && perfil.adulto ? perfil.regiao : '', avatar_id: perfil.adulto ? perfil.avatar_id : null, capa_id: perfil.adulto ? perfil.capa_id : null, cor: perfil.cor, campanhas, apoios });
  }
  if (caminho === '/api/arquivos' && metodo === 'POST') {
    exigirLogin(usuario);
    const finalidade = opcao(dados.finalidade, ['documento','campanha','avatar','capa'], 'finalidade do arquivo');
    let campanhaId = dados.campanha_id || null;
    if (['documento','campanha'].includes(finalidade)) { if (!campanhaId) erro('Salve o rascunho da campanha primeiro.'); exigirResponsavel(usuario, await obterCampanha(texto(campanhaId,'a campanha',36))); }
    else campanhaId = null;
    if (finalidade !== 'documento' && dados.consentimento !== true) erro('Autorize o uso da imagem e evite fotos de pessoas vulneráveis.');
    const arquivo = prepararArquivo(dados.base64, finalidade), id = randomUUID();
    const [limite] = await consultar('SELECT COUNT(*) AS total FROM arquivos WHERE usuario_id=?', [usuario.id]);
    if (Number(limite.total) >= 50) erro('Limite de 50 arquivos por conta atingido.', 409);
    await transacao(async consulta => {
      await consulta('SELECT id FROM usuarios WHERE id=? FOR UPDATE',[usuario.id]);
      const [quantidade] = await consulta('SELECT COUNT(*) AS total FROM arquivos WHERE usuario_id=?',[usuario.id]);
      if (Number(quantidade.total)>=50) erro('Limite de 50 arquivos por conta atingido.',409);
      await consulta('INSERT INTO arquivos (id,usuario_id,campanha_id,nome,mime,finalidade,publico,tamanho,conteudo) VALUES (?,?,?,?,?,?,?,?,?)', [id,usuario.id,campanhaId,nomeSeguro(dados.nome),arquivo.mime,finalidade,Number(finalidade !== 'documento'),arquivo.conteudo.length,arquivo.conteudo]);
      if (finalidade === 'campanha') {
        const [atual] = await consulta('SELECT * FROM campanhas WHERE id=? FOR UPDATE',[campanhaId]);
        await consulta('INSERT INTO campanhas_detalhes (campanha_id,imagem_id) VALUES (?,?) ON DUPLICATE KEY UPDATE imagem_id=VALUES(imagem_id)', [campanhaId,id]);
        if (['ativa','encerrada'].includes(atual.estado)) await marcarEdicao(consulta,atual,usuario.id);
      }
      await auditar(consulta, usuario.id, campanhaId, 'arquivo_recebido', { id, finalidade, tamanho: arquivo.conteudo.length });
    });
    return ok({ id, nome: nomeSeguro(dados.nome), mime: arquivo.mime, finalidade }, 201);
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/arquivos$/)) && metodo === 'GET') {
    const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario, campanha);
    return ok(await consultar('SELECT id,nome,mime,tamanho,finalidade,criado_em FROM arquivos WHERE campanha_id=? ORDER BY criado_em DESC', [campanha.id]));
  }
  if ((partes = caminho.match(/^\/api\/arquivos\/([a-f0-9-]{36})(\/imagem)?$/)) && metodo === 'GET') {
    const [arquivo] = await consultar('SELECT * FROM arquivos WHERE id=?', [partes[1]]);
    if (!arquivo) erro('Arquivo não encontrado.', 404);
    if (partes[2]) {
      let permitido = false;
      if (arquivo.publico && arquivo.mime.startsWith('image/')) {
        if (arquivo.finalidade === 'campanha') { const c = await obterCampanha(arquivo.campanha_id); const [d] = await consultar('SELECT imagem_id FROM campanhas_detalhes WHERE campanha_id=?',[c.id]); permitido = ['ativa','encerrada'].includes(c.estado) && d?.imagem_id===arquivo.id; }
        else if (['avatar','capa'].includes(arquivo.finalidade)) { const [p] = await consultar('SELECT publico,adulto,avatar_id,capa_id FROM perfis WHERE usuario_id=?', [arquivo.usuario_id]); permitido = p?.publico && p?.adulto && [p.avatar_id,p.capa_id].includes(arquivo.id); }
      }
      if (!permitido) erro('Imagem não disponível.', 404);
      resposta.writeHead(200, { 'Content-Type': arquivo.mime, 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-store', 'Content-Security-Policy':"default-src 'none'; sandbox" }); resposta.end(arquivo.conteudo); return { enviada: true };
    }
    exigirLogin(usuario);
    const campanha = arquivo.campanha_id ? await obterCampanha(arquivo.campanha_id) : null;
    if (arquivo.usuario_id !== usuario.id && !usuario.administrador && campanha?.usuario_id !== usuario.id) erro('Você não pode acessar este arquivo.', 403);
    await auditar(consultar, usuario.id, arquivo.campanha_id, 'arquivo_consultado', { id: arquivo.id });
    return ok({ id: arquivo.id, nome: arquivo.nome, mime: arquivo.mime, base64: arquivo.conteudo.toString('base64') });
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/contexto$/))) {
    const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario, campanha);
    if (metodo === 'GET') {
      const [contexto] = await consultar('SELECT * FROM campanhas_detalhes WHERE campanha_id=?', [campanha.id]);
      return ok(contexto || { campanha_id: campanha.id, uf:'', municipio:'', mapa_autorizado:false, submetida:false });
    }
    if (metodo === 'PUT') {
      const autorizado = dados.mapa_autorizado === true, uf = texto(dados.uf || '', 'a UF', 2, autorizado).toUpperCase(), municipio = texto(dados.municipio || '', 'o município aproximado', 100, false);
      if (uf && !UFS.includes(uf)) erro('Selecione uma UF válida.');
      if (autorizado && /(\d{2,}|rua |avenida |travessa )/i.test(municipio)) erro('Informe somente o município, sem endereço.');
      await transacao(async consulta => {
        await consulta('INSERT INTO campanhas_detalhes (campanha_id,uf,municipio,mapa_autorizado) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE uf=VALUES(uf),municipio=VALUES(municipio),mapa_autorizado=VALUES(mapa_autorizado)', [campanha.id,autorizado ? uf : '',autorizado ? municipio : '',Number(autorizado)]);
        await auditar(consulta, usuario.id, campanha.id, 'consentimento_mapa', { autorizado, uf: autorizado ? uf : '' });
      });
      return ok({ mensagem: 'Preferência de localização salva.' });
    }
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/enviar$/)) && metodo === 'POST') {
    exigirLogin(usuario);
    return ok(await transacao(async consulta => {
      const campanha = await obterCampanha(partes[1], consulta, true); exigirResponsavel(usuario, campanha);
      const [perfil] = await consulta('SELECT adulto FROM perfis WHERE usuario_id=?', [campanha.usuario_id]);
      if (!perfil?.adulto) erro('Um responsável maior de 18 anos deve completar o perfil antes de enviar a campanha.', 409);
      if (!['rascunho','ajustes'].includes(campanha.estado)) erro('Esta campanha não está em preparação.', 409);
      await consulta('INSERT INTO campanhas_detalhes (campanha_id,submetida) VALUES (?,1) ON DUPLICATE KEY UPDATE submetida=1', [campanha.id]);
      await consulta("UPDATE campanhas SET estado='rascunho' WHERE id=?", [campanha.id]);
      await auditar(consulta, usuario.id, campanha.id, 'enviada_para_analise');
      return { mensagem: 'Campanha enviada. A publicação depende da revisão administrativa.' };
    }));
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/urgencia$/))) {
    const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario, campanha);
    if (metodo === 'GET') {
      const [urgencia] = await consultar('SELECT * FROM urgencias WHERE campanha_id=?', [campanha.id]);
      const historico = await consultar('SELECT id,acao,dados,criado_em FROM urgencia_historico WHERE campanha_id=? ORDER BY id DESC', [campanha.id]);
      return ok({ solicitacao: urgencia || null, publica: urgenciaPublica(urgencia), historico: historico.map(h => ({ ...h, dados:json(h.dados) })) });
    }
    if (metodo === 'POST') {
      if (!['ativa','rascunho','ajustes'].includes(campanha.estado)) erro('Esta campanha não pode solicitar urgência agora.', 409);
      const natureza = opcao(dados.natureza,Object.keys(naturezas),'natureza'), consequencias = texto(dados.consequencias,'as consequências',3000);
      if (consequencias.length < 30) erro('Explique as consequências com pelo menos 30 caracteres.');
      const prazo = dataISO(dados.prazo_limite);
      if (!prazo || diasAte(prazo) < 0) erro('Informe um prazo real ainda não vencido (AAAA-MM-DD).');
      const recursos = inteiro(dados.recursos_disponiveis ?? 0,'os recursos disponíveis',0);
      const [meta] = await consultar("SELECT COALESCE(SUM(meta),0) AS meta,COALESCE(SUM(recebido),0) AS recebido FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'", [campanha.id]);
      const avaliacao = avaliarUrgencia({ natureza,consequencias,prazo_limite:prazo,recursos_disponiveis:recursos },Number(meta.meta),Number(meta.recebido));
      await transacao(async consulta => {
        await obterCampanha(campanha.id, consulta, true);
        await consulta("INSERT INTO urgencias (campanha_id,natureza,consequencias,prazo_limite,recursos_disponiveis,pontos,recomendacao) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE natureza=VALUES(natureza),consequencias=VALUES(consequencias),prazo_limite=VALUES(prazo_limite),recursos_disponiveis=VALUES(recursos_disponiveis),pontos=VALUES(pontos),recomendacao=VALUES(recomendacao),estado='pendente',classe='regular',evidencia_verificada=0,revisado_por=NULL", [campanha.id,natureza,consequencias,prazo,recursos,avaliacao.pontos,avaliacao.recomendacao]);
        await consulta("INSERT INTO urgencia_historico (campanha_id,usuario_id,acao,dados) VALUES (?,?,'solicitacao',?)", [campanha.id,usuario.id,JSON.stringify(avaliacao)]);
        await auditar(consulta,usuario.id,campanha.id,'urgencia_solicitada',{ pontos:avaliacao.pontos });
      });
      return ok({ mensagem:'Solicitação salva para revisão humana. A recomendação não concede prioridade.', recomendacao:avaliacao },201);
    }
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/urgencia\/recurso$/)) && metodo === 'POST') {
    const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario,campanha);
    const motivo = texto(dados.motivo,'o motivo do recurso',2000);
    await transacao(async consulta => {
      await obterCampanha(campanha.id,consulta,true);
      const [existente] = await consulta('SELECT * FROM urgencias WHERE campanha_id=? FOR UPDATE',[campanha.id]);
      if (!existente || existente.estado !== 'revisada') erro('O recurso exige uma decisão anterior.',409);
      await consulta("UPDATE urgencias SET estado='recurso',evidencia_verificada=0 WHERE campanha_id=?",[campanha.id]);
      await consulta("INSERT INTO urgencia_historico (campanha_id,usuario_id,acao,dados) VALUES (?,?,'recurso',?)",[campanha.id,usuario.id,JSON.stringify({ motivo })]);
      await auditar(consulta,usuario.id,campanha.id,'recurso_urgencia');
    });
    return ok({ mensagem:'Recurso enviado. A prioridade aguarda nova revisão humana.' },201);
  }
  if ((partes = caminho.match(/^\/api\/administracao\/urgencias\/([^/]+)$/)) && metodo === 'PATCH') {
    exigirAdministrador(usuario);
    return ok(await transacao(async consulta => {
      const campanha = await obterCampanha(partes[1],consulta,true);
      if (campanha.usuario_id === usuario.id) erro('Não avalie sua própria campanha.',403);
      const [u] = await consulta('SELECT * FROM urgencias WHERE campanha_id=? FOR UPDATE',[campanha.id]);
      if (!u) erro('Solicitação não encontrada.',404);
      const classe = opcao(dados.classe,['regular','moderada','critica'],'classificação'), justificativa = texto(dados.justificativa,'a justificativa humana',3000), validade = dataISO(dados.validade);
      if (justificativa.length < 20) erro('Justifique a avaliação com pelo menos 20 caracteres.');
      const verificada = dados.evidencia_verificada === true;
      if (classe !== 'regular') {
        const [documentos] = await consulta("SELECT COUNT(*) AS total FROM arquivos WHERE campanha_id=? AND finalidade='documento'",[campanha.id]);
        if (!verificada || !validade || diasAte(validade) < 0 || diasAte(u.prazo_limite) < 0 || !Number(documentos.total)) erro('Prioridade exige evidência privada revisada e prazo/validade ainda vigentes.',409);
      }
      const [meta] = await consulta("SELECT COALESCE(SUM(meta),0) AS meta,COALESCE(SUM(recebido),0) AS recebido FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'",[campanha.id]);
      const avaliacao = avaliarUrgencia({ ...u,evidencia_verificada:verificada,evidencia_valida_ate:validade },Number(meta.meta),Number(meta.recebido));
      if (classe === 'critica' && avaliacao.recomendacao !== 'critica') erro('Os critérios objetivos ainda não sustentam uma classificação crítica.',409);
      if (classe === 'moderada' && avaliacao.pontos < 40) erro('Os critérios objetivos ainda não sustentam uma classificação moderada.',409);
      await consulta("UPDATE urgencias SET classe=?,estado='revisada',pontos=?,recomendacao=?,evidencia_verificada=?,evidencia_valida_ate=?,revisado_por=?,justificativa=?,revisada_em=CURRENT_TIMESTAMP WHERE campanha_id=?", [classe,avaliacao.pontos,avaliacao.recomendacao,Number(verificada),validade,usuario.id,justificativa,campanha.id]);
      await consulta("INSERT INTO urgencia_historico (campanha_id,usuario_id,acao,dados) VALUES (?,?,'decisao',?)",[campanha.id,usuario.id,JSON.stringify({ ...avaliacao,classe,justificativa,validade })]);
      await auditar(consulta,usuario.id,campanha.id,'urgencia_revisada',{ classe,pontos:avaliacao.pontos,validade });
      return { mensagem:'Revisão humana registrada.',classe,pontos:avaliacao.pontos };
    }));
  }
  if (caminho === '/api/descoberta' && metodo === 'GET') {
    const params = new URL(requisicao.url,'http://localhost').searchParams;
    let lista = await completarCampanhas(consultar,await consultar("SELECT c.id,c.titulo,c.descricao,c.categoria,c.regiao,c.prazo,c.evento,c.estado,c.criada_em,c.usuario_id,u.nome AS responsavel FROM campanhas c JOIN usuarios u ON u.id=c.usuario_id WHERE c.estado IN ('ativa','encerrada')"));
    const busca = (params.get('busca') || '').toLocaleLowerCase().trim(), uf = params.get('uf'), categoria = params.get('categoria'), urgencia = params.get('urgencia');
    const min = params.get('min'), max = params.get('max'), prazo = params.get('prazo');
    for (const valor of [min,max,prazo]) if (valor !== null && (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)))) erro('Filtro numérico inválido.');
    lista = lista.filter(c => (!busca || (c.titulo+' '+c.descricao).toLocaleLowerCase().includes(busca)) && (!uf || c.uf===uf) && (!categoria || c.categoria===categoria) && (!urgencia || c.urgencia.classe===urgencia) && (params.get('revisadas')!=='1' || c.urgencia.revisada) && (min===null || c.meta_financeira>=Number(min)) && (max===null || c.meta_financeira<=Number(max)) && (prazo===null || (c.urgencia.prazo && diasAte(c.urgencia.prazo)<=Number(prazo))));
    const ordem = params.get('ordem');
    if (ordem==='recentes') lista.sort((a,b)=>new Date(b.criada_em)-new Date(a.criada_em));
    else if (ordem==='pouca-visibilidade') lista.sort((a,b)=>a.visualizacoes-b.visualizacoes);
    else if (ordem==='conclusao') lista.sort((a,b)=>(b.recebido_financeiro/Math.max(1,b.meta_financeira))-(a.recebido_financeiro/Math.max(1,a.meta_financeira)));
    else lista=ordenarFeed(lista);
    return ok(lista.slice(0,200));
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/visualizacao$/)) && metodo === 'POST') {
    const campanha = await obterCampanha(partes[1]); conferirVisibilidade(campanha,usuario);
    const cookies = Object.fromEntries(String(requisicao.headers.cookie || '').split(';').map(x=>x.trim().split('=')));
    const visitante = /^[a-f0-9]{32}$/.test(cookies.soma_visitante || '') ? cookies.soma_visitante : randomBytes(16).toString('hex');
    resposta.setHeader('Set-Cookie','soma_visitante='+visitante+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000');
    const hash = createHash('sha256').update(visitante).digest('hex');
    await transacao(async consulta => {
      const insercao = await consulta('INSERT IGNORE INTO visualizacoes (campanha_id,visitante,dia) VALUES (?,?,UTC_DATE())',[campanha.id,hash]);
      if(insercao.affectedRows) await consulta('INSERT INTO campanhas_detalhes (campanha_id,visualizacoes) VALUES (?,1) ON DUPLICATE KEY UPDATE visualizacoes=visualizacoes+1',[campanha.id]);
    });
    return ok({ mensagem:'Visualização registrada uma vez por dia neste navegador.' });
  }
  if (caminho === '/api/mapa' && metodo === 'GET') {
    const lista = await completarCampanhas(consultar,await consultar("SELECT id,titulo,categoria,criada_em,usuario_id,estado FROM campanhas WHERE estado='ativa'"));
    const categoria = new URL(requisicao.url,'http://localhost').searchParams.get('categoria');
    const estados = new Map();
    for(const c of lista.filter(c=>c.mapa_autorizado && UFS.includes(c.uf) && (!categoria || c.categoria===categoria))){
      const e=estados.get(c.uf) || { uf:c.uf,campanhas:[],criticas:0,moderadas:0,restante:0,intensidade:0 };
      const restante=Math.max(0,c.meta_financeira-c.recebido_financeiro);
      e.campanhas.push({id:c.id,titulo:c.titulo,categoria:c.categoria,municipio:c.municipio,urgencia:c.urgencia,restante});
      e.criticas+=Number(c.urgencia.classe==='critica');e.moderadas+=Number(c.urgencia.classe==='moderada');e.restante+=restante;
      e.intensidade+=(c.urgencia.classe==='critica'?3:c.urgencia.classe==='moderada'?1.5:.5)+Math.min(3,restante/100000)+(c.urgencia.prazo && diasAte(c.urgencia.prazo)<=7?1:0);
      estados.set(c.uf,e);
    }
    return ok({ estados:[...estados.values()],indicador:'Soma de pesos: urgência revisada (3 crítica / 1,5 moderada / 0,5 regular), lacuna financeira (até 3 pontos por campanha) e prazo revisado até 7 dias (+1). Retrata apenas campanhas cadastradas que consentiram; não mede a necessidade social da população.',agregacao:'UF',simulado:true });
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/rota$/)) && metodo === 'GET') {
    const campanha=await obterCampanha(partes[1]);conferirVisibilidade(campanha,usuario);
    const [metas,creditos,doacoes,historicoAnuncios,saldo,u] = await Promise.all([
      consultar("SELECT id,nome,meta,recebido FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'",[campanha.id]),
      consultar("SELECT COALESCE(SUM(valor),0) AS valor,COUNT(*) AS quantidade FROM lancamentos WHERE campanha_id=? AND origem='anuncio'",[campanha.id]),
      consultar("SELECT p.valor_liquido AS valor,p.criado_em FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id WHERE n.campanha_id=? AND p.estado='confirmado'",[campanha.id]),
      consultar("SELECT valor,criado_em FROM lancamentos WHERE campanha_id=? AND origem='anuncio'",[campanha.id]),
      calcularSaldo(campanha.id),
      consultar('SELECT * FROM urgencias WHERE campanha_id=?',[campanha.id]),
    ]);
    const meta=metas.reduce((s,n)=>s+n.meta,0),confirmado=metas.reduce((s,n)=>s+n.recebido,0),restante=Math.max(0,meta-confirmado),urgencia=urgenciaPublica(u[0]);
    const params=new URL(requisicao.url,'http://localhost').searchParams;
    let projecao;
    try{projecao=criarProjecao({doacoes,anuncios:historicoAnuncios,restante,urgencia,disponivel:saldo.disponivel,estado:campanha.estado},{taxa_mensal:params.get('taxa_mensal')??undefined,dias:params.get('dias'),custos:params.get('custos')});}
    catch(e){erro(e.message);}
    const primeiros=Math.min(20000,meta);
    const marcos=[
      {id:'criada',titulo:'Uma causa começa',detalhe:'Campanha registrada no SOMA.',concluido:true},
      {id:'primeiros',titulo:'Primeiros '+(primeiros/100).toFixed(2).replace('.',',')+' reais',detalhe:'Somente valores confirmados contam.',concluido:meta>0&&confirmado>=primeiros},
      {id:'projecao',titulo:'Um horizonte possível',detalhe:projecao.mensagem,concluido:Boolean(projecao.doacoes)},
      {id:'anuncios',titulo:'Os anúncios também somam',detalhe:'Primeiro crédito publicitário conciliado no ambiente de simulação.',concluido:Number(creditos[0].valor)>0},
      ...[25,50,75,100].map(p=>({id:'meta-'+p,titulo:p===100?'Objetivo alcançado':p+'% da meta',detalhe:'Marco de '+(meta*p/10000).toFixed(2).replace('.',',')+' reais confirmados.',concluido:meta>0&&confirmado>=Math.ceil(meta*p/100)})),
    ];
    let atual=false;
    for(const m of marcos){const opcional=['projecao','anuncios'].includes(m.id);m.estado=m.concluido?'concluido':!atual&&!opcional?'atual':'futuro';if(!m.concluido&&!opcional)atual=true;}
    return ok({campanha:{id:campanha.id,titulo:campanha.titulo,estado:campanha.estado,categoria:campanha.categoria},simulado:true,meta,confirmado,disponivel:saldo.disponivel,reservado:saldo.reservado,repassado:saldo.repassado,restante,percentual:meta>0?Math.min(100,confirmado/meta*100):0,doacoes_confirmadas:doacoes.reduce((s,p)=>s+Number(p.valor),0),quantidade_doacoes:doacoes.length,anuncios_creditados:Number(creditos[0].valor),saldo_legado:confirmado-doacoes.reduce((s,p)=>s+Number(p.valor),0)-Number(creditos[0].valor),aplicado:0,rendimentos_realizados:0,urgencia,necessidades:metas,marcos,projecao});
  }
  if (caminho==='/api/administracao/soma2' && metodo==='GET'){
    exigirAdministrador(usuario);
    const [receitas,distribuicoes,urgencias,auditoria,lancamentos]=await Promise.all([
      consultar('SELECT r.*,COALESCE((SELECT SUM(valor) FROM distribuicoes d WHERE d.receita_id=r.id),0) AS distribuido FROM receitas_publicitarias r ORDER BY r.id DESC'),
      consultar('SELECT d.*,c.titulo AS campanha FROM distribuicoes d JOIN campanhas c ON c.id=d.campanha_id ORDER BY d.id DESC'),
      consultar("SELECT u.*,c.titulo,c.estado AS campanha_estado FROM urgencias u JOIN campanhas c ON c.id=u.campanha_id ORDER BY u.estado='pendente' DESC,u.prazo_limite"),
      consultar('SELECT id,usuario_id,campanha_id,acao,dados,criado_em FROM auditoria ORDER BY id DESC LIMIT 100'),
      consultar('SELECT l.*,c.titulo AS campanha FROM lancamentos l JOIN campanhas c ON c.id=l.campanha_id ORDER BY l.id DESC LIMIT 100'),
    ]);
    return ok({simulado:true,receitas:receitas.map(r=>({...r,...dividirReceita(r.bruto,r.tributos,r.custos),distribuido:Number(r.distribuido),retido:Math.floor((r.bruto-r.tributos-r.custos)*.7)-Number(r.distribuido)})),distribuicoes,urgencias,auditoria,lancamentos});
  }
  if (caminho==='/api/fundo' && metodo==='GET'){
    const [totais]=await consultar("SELECT COALESCE(SUM(bruto-tributos-custos),0) AS liquido,COALESCE(SUM(FLOOR((bruto-tributos-custos)*70/100)),0) AS fundo FROM receitas_publicitarias WHERE estado IN ('confirmada','distribuida')");
    const [creditos]=await consultar('SELECT COALESCE(SUM(valor),0) AS total FROM distribuicoes');
    const campanhas=await consultar("SELECT c.id,c.titulo,SUM(d.valor) AS valor FROM distribuicoes d JOIN campanhas c ON c.id=d.campanha_id WHERE c.estado IN ('ativa','encerrada') GROUP BY c.id,c.titulo ORDER BY valor DESC");
    return ok({simulado:true,liquido:Number(totais.liquido),fundo:Number(totais.fundo),operacao:Number(totais.liquido)-Number(totais.fundo),distribuido:Number(creditos.total),retido:Number(totais.fundo)-Number(creditos.total),campanhas});
  }
  if(caminho==='/api/administracao/receitas' && metodo==='POST'){
    exigirAdministrador(usuario);
    const bruto=inteiro(dados.bruto,'a receita bruta'),tributos=inteiro(dados.tributos ?? 0,'os tributos',0),custos=inteiro(dados.custos ?? 0,'os custos publicitários',0);
    if(tributos+custos>bruto)erro('Tributos e custos não podem superar a receita.');
    if(dados.modo && dados.modo!=='simulado')erro('Não existe integração publicitária real configurada.',409);
    const referencia=texto(dados.referencia,'a referência da conciliação de teste',120),justificativa=texto(dados.justificativa,'a origem e os custos da simulação',1000);
    return ok(await transacao(async consulta=>umaVez(consulta,usuario.id,requisicao,dados,async()=>{
      const r=await consulta('INSERT INTO receitas_publicitarias (referencia,bruto,tributos,custos,justificativa,usuario_id) VALUES (?,?,?,?,?,?)',[referencia,bruto,tributos,custos,justificativa,usuario.id]);
      await auditar(consulta,usuario.id,null,'receita_simulada_criada',{id:r.insertId,bruto,tributos,custos});return{id:r.insertId,estado:'pendente',simulado:true};
    })),201);
  }
  if((partes=caminho.match(/^\/api\/administracao\/receitas\/(\d+)\/(confirmar|distribuir)$/))&&metodo==='POST'){
    exigirAdministrador(usuario); const id=Number(partes[1]),acao=partes[2];
    return ok(await transacao(async consulta=>umaVez(consulta,usuario.id,requisicao,dados,async()=>{
      const [receita]=await consulta('SELECT * FROM receitas_publicitarias WHERE id=? FOR UPDATE',[id]);
      if(!receita)erro('Receita não encontrada.',404);
      if(acao==='confirmar'){
        if(receita.estado==='distribuida')erro('Receita já distribuída.',409);
        if(dados.conciliacao_confirmada!==true)erro('Confirme a conciliação da receita de teste.');
        await consulta("UPDATE receitas_publicitarias SET estado='confirmada',confirmada_em=COALESCE(confirmada_em,CURRENT_TIMESTAMP) WHERE id=?",[id]);
        await auditar(consulta,usuario.id,null,'receita_simulada_conciliada',{id});
        return{mensagem:'Receita simulada conciliada. Nenhuma impressão gerou crédito automático.'};
      }
      if(receita.estado!=='confirmada')erro('Somente receita confirmada e ainda não distribuída pode gerar créditos.',409);
      // Ordem fixa de locks de campanhas, compatível com pagamentos e confirmações.
      const campanhas=await consulta("SELECT c.* FROM campanhas c JOIN urgencias u ON u.campanha_id=c.id JOIN perfis p ON p.usuario_id=c.usuario_id AND p.adulto=1 WHERE c.estado='ativa' AND u.classe='critica' AND u.estado='revisada' ORDER BY c.id FOR UPDATE");
      const candidatas=[];
      for(const c of campanhas){
        const [u]=await consulta('SELECT * FROM urgencias WHERE campanha_id=?',[c.id]);
        if(!urgenciaPublica(u).revisada || urgenciaPublica(u).classe!=='critica' || c.usuario_id===usuario.id)continue;
        const necessidades=await consulta("SELECT n.*,(SELECT COALESCE(SUM(valor_liquido),0) FROM pagamentos p WHERE p.necessidade_id=n.id AND p.estado='pendente') AS pendente FROM necessidades n WHERE campanha_id=? AND tipo='dinheiro' ORDER BY n.id FOR UPDATE",[c.id]);
        const livres=necessidades.map(n=>({...n,livre:Math.max(0,n.meta-n.recebido-Number(n.pendente))})).filter(n=>n.livre>0);
        const [anterior]=await consulta('SELECT COALESCE(SUM(d.valor),0) AS total FROM distribuicoes d JOIN campanhas ca ON ca.id=d.campanha_id WHERE ca.usuario_id=?',[c.usuario_id]);
        candidatas.push({id:c.id,usuario_id:c.usuario_id,dias:diasAte(u.prazo_limite),meta:necessidades.reduce((s,n)=>s+n.meta,0),falta:livres.reduce((s,n)=>s+n.livre,0),anterior:Number(anterior.total),necessidades:livres});
      }
      const valores=dividirReceita(receita.bruto,receita.tributos,receita.custos),rateio=distribuirFundo(valores.fundo,candidatas);
      if(!rateio.alocacoes.length)erro('Nenhuma campanha crítica revisada está elegível. O fundo permanece sem crédito.',409);
      for(const c of rateio.alocacoes){
        let valor=c.valor;
        for(const n of c.necessidades){
          const parcela=Math.min(n.livre,valor);if(!parcela)continue;
          await consulta('INSERT INTO distribuicoes (receita_id,campanha_id,necessidade_id,valor,peso,criterios) VALUES (?,?,?,?,?,?)',[id,c.id,n.id,parcela,c.peso,JSON.stringify(c.criterios)]);
          await lancar(consulta,c.id,n.id,'anuncio','anuncio:'+id+':'+n.id,parcela);
          await consulta('UPDATE necessidades SET recebido=recebido+? WHERE id=?',[parcela,n.id]);valor-=parcela;
        }
        await auditar(consulta,usuario.id,c.id,'anuncio_simulado_creditado',{receita_id:id,valor:c.valor,criterios:c.criterios});
      }
      await consulta("UPDATE receitas_publicitarias SET estado='distribuida' WHERE id=?",[id]);
      return{simulado:true,...valores,distribuido:valores.fundo-rateio.retido,retido:rateio.retido,campanhas:rateio.alocacoes.map(c=>({id:c.id,valor:c.valor,peso:c.peso,criterios:c.criterios}))};
    })));
  }
  return null;
}
module.exports={atenderSoma2,completarCampanhas,ordenarFeed,marcarEdicao,revisarPublicacao,auditar,lancar,UFS};
