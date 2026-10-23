const { erro, texto, inteiro, opcao } = require('./auxiliares');
const { umaVez } = require('./operacoes');
const { classificarUrgencia, distribuirFundo, resumoFinanceiro, projetar, dataPrazo } = require('./inteligencia');
const { registrarMarcos } = require('./marcos');
const ufs = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
function imagemSegura(valor) {
  if (valor === '') return '';
  if (typeof valor !== 'string' || valor.length > 70000 || !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(valor)) erro('Use imagem PNG, JPEG ou WebP de até 50 KB.');
  const conteudo = Buffer.from(valor.split(',')[1], 'base64');
  const valido = valor.startsWith('data:image/png;') ? conteudo.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : valor.startsWith('data:image/jpeg;') ? conteudo[0] === 255 && conteudo[1] === 216 && conteudo[2] === 255 : conteudo.toString('ascii', 0, 4) === 'RIFF' && conteudo.toString('ascii', 8, 12) === 'WEBP';
  if (!valido) erro('O conteúdo não corresponde a uma imagem válida.');
  return valor;
}
const revisaoAtual = `SELECT r.* FROM revisoes_urgencia r WHERE r.estado='revisada' AND r.valida_ate>UTC_TIMESTAMP() AND r.id=(SELECT MAX(r2.id) FROM revisoes_urgencia r2 WHERE r2.campanha_id=r.campanha_id)`;

async function atenderExtensoes({ caminho, metodo, dados, usuario, requisicao, endereco, consultar, transacao, obterCampanha, conferirVisibilidade, exigirLogin, exigirResponsavel, exigirAdministrador, calcularSaldo }) {
  let partes;
  const ok = dados => ({ codigo: 200, dados });
  if (caminho === '/api/perfil/personalizacao') {
    exigirLogin(usuario);
    if (metodo === 'GET') {
      const [perfil] = await consultar('SELECT * FROM perfis WHERE usuario_id=?', [usuario.id]);
      return ok(perfil || { biografia: '', foto: '', capa: '', tipo: 'pessoa', mostrar_apoios: false });
    }
    if (metodo === 'PUT') {
      const biografia = texto(dados.biografia || '', 'a biografia', 500, false);
      const tipo = opcao(dados.tipo, ['pessoa', 'instituicao'], 'perfil');
      if (typeof dados.mostrar_apoios !== 'boolean') erro('Preferência de privacidade inválida.');
      const foto = imagemSegura(dados.foto || ''), capa = imagemSegura(dados.capa || '');
      await consultar('INSERT INTO perfis (usuario_id,biografia,foto,capa,tipo,mostrar_apoios) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE biografia=?,foto=?,capa=?,tipo=?,mostrar_apoios=?', [usuario.id, biografia, foto, capa, tipo, dados.mostrar_apoios, biografia, foto, capa, tipo, dados.mostrar_apoios]);
      return ok({ biografia, foto, capa, tipo, mostrar_apoios: dados.mostrar_apoios });
    }
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/inteligencia$/)) && metodo === 'GET') {
    const campanha = await obterCampanha(partes[1]); conferirVisibilidade(campanha, usuario);
    const [soma] = await consultar("SELECT COALESCE(SUM(meta),0) AS meta,COALESCE(SUM(recebido),0) AS recebido FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'", [campanha.id]);
    const [anuncios] = await consultar('SELECT COALESCE(SUM(valor),0) AS total FROM distribuicoes_solidarias WHERE campanha_id=?', [campanha.id]);
    const [urgencia] = await consultar(revisaoAtual + ' AND r.campanha_id=?', [campanha.id]);
    const [localizacao] = await consultar('SELECT uf FROM localizacoes_publicas WHERE campanha_id=?', [campanha.id]);
    const [foto] = await consultar('SELECT imagem FROM imagens_campanha WHERE campanha_id=?', [campanha.id]);
    const datas = await consultar('SELECT chave,alcancado_em FROM marcos_financeiros WHERE campanha_id=?', [campanha.id]);
    const [primeiroAnuncio] = await consultar('SELECT MIN(r.criada_em) AS data FROM receitas_solidarias r JOIN distribuicoes_solidarias d ON d.receita_id=r.id WHERE d.campanha_id=?', [campanha.id]);
    const [apoios] = await consultar("SELECT COUNT(DISTINCT usuario_id) AS total FROM (SELECT p.usuario_id FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id WHERE n.campanha_id=? AND p.estado='confirmado' UNION SELECT usuario_id FROM ajudas WHERE campanha_id=? AND recebido>0) apoio", [campanha.id, campanha.id]);
    const financeiro = resumoFinanceiro(Number(soma.meta), Number(soma.recebido), Number(anuncios.total));
    const saldo = await calcularSaldo(campanha.id);
    // O livro dos anúncios é separado do saldo de pagamentos: não autoriza saque.
    const valores = [0, Math.min(20000, financeiro.meta), financeiro.meta * .25, financeiro.meta * .5, financeiro.meta * .75, financeiro.meta].map(Math.round);
    const marcos = valores.map((valor, indice) => ({ id: 'financeiro-' + indice, titulo: ['Início da jornada', 'Primeiras contribuições', '25% da meta', '50% da meta', '75% da meta', 'Objetivo alcançado'][indice], valor, concluido: indice === 0 || financeiro.meta > 0 && financeiro.arrecadado >= valor, data: indice === 0 ? campanha.criada_em : null, icone: indice === 5 ? 'trofeu' : indice === 1 ? 'coracao' : 'moedas' }));
    marcos.splice(2, 0, { id: 'anuncios', titulo: 'Primeira distribuição dos anúncios', valor: Number(anuncios.total), concluido: Number(anuncios.total) > 0, data: primeiroAnuncio.data, icone: 'anuncio' }, { id: 'rendimento', titulo: 'Primeiro rendimento creditado', valor: 0, concluido: false, data: null, icone: 'grafico' });
    marcos.splice(2, 0, { id: 'apoiadores', titulo: 'Primeiro apoiador confirmado', valor: Number(apoios.total), unidade: 'pessoas', concluido: Number(apoios.total) > 0, data: Number(apoios.total) > 0 ? datas.find(d => d.chave === 'apoiadores:1')?.alcancado_em || null : null, icone: 'pessoas' });
    for (const marco of marcos) if (marco.concluido && marco.id !== 'financeiro-0' && marco.id.startsWith('financeiro')) marco.data = datas.find(d => d.chave === `${marco.id}:${marco.valor}`)?.alcancado_em || null;
    return ok({ ...financeiro, saldo_disponivel: saldo.disponivel, anuncios_disponiveis_simulados: Number(anuncios.total), simulado: true, rendimentos: 0, marcos, urgencia: urgencia ? { categoria: urgencia.categoria, pontos: urgencia.pontos, valida_ate: urgencia.valida_ate, verificada: true } : { categoria: 'Regular', verificada: false }, uf: localizacao?.uf || '', imagem: foto?.imagem || '', campanha: campanha.titulo });
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/projecao$/)) && metodo === 'POST') {
    const campanha = await obterCampanha(partes[1]); conferirVisibilidade(campanha, usuario);
    const saldo = await calcularSaldo(campanha.id);
    return ok(projetar(Math.max(0, saldo.disponivel), dados.taxa_mensal, dados.anuncios_mensais, dados.meses));
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/(localizacao|imagem)$/)) && metodo === 'PUT') {
    await transacao(async consulta => {
      const campanha = await obterCampanha(partes[1], consulta, true); exigirResponsavel(usuario, campanha);
      if (partes[2] === 'localizacao') {
        const uf = opcao(dados.uf, ufs, 'estado');
        await consulta('INSERT INTO localizacoes_publicas (campanha_id,uf) VALUES (?,?) ON DUPLICATE KEY UPDATE uf=?', [campanha.id, uf, uf]);
      } else {
        const imagem = imagemSegura(dados.imagem);
        await consulta('INSERT INTO imagens_campanha (campanha_id,imagem) VALUES (?,?) ON DUPLICATE KEY UPDATE imagem=?', [campanha.id, imagem, imagem]);
      }
    });
    return ok({ mensagem: 'Informação salva.' });
  }
  if ((partes = caminho.match(/^\/api\/campanhas\/([^/]+)\/urgencia$/))) {
    const campanha = await obterCampanha(partes[1]); exigirResponsavel(usuario, campanha);
    if (metodo === 'GET') return ok(await consultar('SELECT * FROM revisoes_urgencia WHERE campanha_id=? ORDER BY id DESC', [campanha.id]));
    if (metodo === 'POST') {
      const relato = texto(dados.relato, 'o relato, prazo e referência das evidências', 4000);
      await transacao(async consulta => {
        await obterCampanha(campanha.id, consulta, true);
        const [pendente] = await consulta("SELECT id FROM revisoes_urgencia WHERE campanha_id=? AND estado='pendente'", [campanha.id]);
        if (pendente) erro('Já existe análise pendente. Aguarde a revisão.', 409);
        await consulta('INSERT INTO revisoes_urgencia (campanha_id,autor_id,relato) VALUES (?,?,?)', [campanha.id, usuario.id, relato]);
      });
      return ok({ mensagem: 'Pedido ou recurso enviado para revisão humana. Prioridade anterior expirada.' });
    }
  }
  if (caminho === '/api/mapa' && metodo === 'GET') {
    const campanhas = await consultar(`SELECT c.id,c.titulo,c.categoria,c.prazo,l.uf,COALESCE(r.categoria,'Regular') AS urgencia,IF(r.id IS NULL,0,1) AS verificada FROM campanhas c LEFT JOIN localizacoes_publicas l ON l.campanha_id=c.id LEFT JOIN (${revisaoAtual}) r ON r.campanha_id=c.id WHERE c.estado='ativa'`);
    const categoria = endereco.searchParams.get('categoria'), urgencia = endereco.searchParams.get('urgencia');
    return ok({ campanhas: campanhas.filter(c => (!categoria || c.categoria === categoria) && (!urgencia || c.urgencia === urgencia)), aviso: 'Campanhas cadastradas; não representa necessidade social absoluta. Localização aproximada por UF, informada pelo responsável.' });
  }
  if (caminho.startsWith('/api/administracao/solidariedade')) {
    exigirAdministrador(usuario);
    if (caminho === '/api/administracao/solidariedade' && metodo === 'GET') return ok({ revisoes: await consultar('SELECT r.*,c.titulo FROM revisoes_urgencia r JOIN campanhas c ON c.id=r.campanha_id ORDER BY r.id DESC LIMIT 100'), receitas: await consultar('SELECT * FROM receitas_solidarias ORDER BY id DESC LIMIT 100') });
    if ((partes = caminho.match(/^\/api\/administracao\/solidariedade\/urgencia\/(\d+)$/)) && metodo === 'PATCH') {
      const justificativa = texto(dados.justificativa, 'a justificativa da revisão humana', 2000);
      await transacao(async consulta => {
        const [pedido] = await consulta('SELECT r.*,c.prazo,c.usuario_id FROM revisoes_urgencia r JOIN campanhas c ON c.id=r.campanha_id WHERE r.id=? FOR UPDATE', [partes[1]]);
        if (!pedido) erro('Solicitação não encontrada.', 404);
        if (pedido.estado !== 'pendente') erro('Solicitação já revisada.', 409);
        if (pedido.usuario_id === usuario.id) erro('Outro administrador deve revisar sua campanha.', 403);
        const revisao = classificarUrgencia(dados, pedido.prazo);
        await consulta("UPDATE revisoes_urgencia SET estado='revisada',criterios=?,categoria=?,pontos=?,justificativa=?,revisor_id=?,revisada_em=UTC_TIMESTAMP(),valida_ate=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY) WHERE id=?", [JSON.stringify({ ...dados, regras: revisao.regras, versao: revisao.versao }), revisao.categoria, revisao.pontos, justificativa, usuario.id, pedido.id]);
      });
      return ok({ mensagem: 'Revisão auditada. Validade máxima: sete dias; reavalie se as circunstâncias mudarem.' });
    }
    if (caminho === '/api/administracao/solidariedade/simular' && metodo === 'POST') {
      const referencia = texto(dados.referencia, 'a referência única da receita', 100);
      inteiro(dados.valor, 'receita de teste', 1, 100000000);
      const resultado = await transacao(async consulta => umaVez(consulta, usuario.id, requisicao, dados, async () => {
        // Bloqueio compartilhado pela distribuição: evita duas receitas excederem a mesma meta.
        const campanhas = await consulta("SELECT c.* FROM campanhas c WHERE c.estado='ativa' ORDER BY c.id FOR UPDATE");
        const elegiveis = [];
        for (const c of campanhas) {
          const [r] = await consulta(revisaoAtual + ' AND r.campanha_id=?', [c.id]);
          const [s] = await consulta("SELECT COALESCE(SUM(meta-recebido),0) AS restante FROM necessidades WHERE campanha_id=? AND tipo='dinheiro'", [c.id]);
          const [a] = await consulta('SELECT COALESCE(SUM(valor),0) AS total FROM distribuicoes_solidarias WHERE campanha_id=?', [c.id]);
          const [pendentes] = await consulta("SELECT COALESCE(SUM(p.valor_liquido),0) AS total FROM pagamentos p JOIN necessidades n ON n.id=p.necessidade_id WHERE n.campanha_id=? AND p.estado='pendente'", [c.id]);
          const prazo = dataPrazo(c.prazo);
          elegiveis.push({ id: c.id, urgencia: r?.categoria, verificada: !!r, pontos: r?.pontos || 0, restante: Math.max(0, Number(s.restante) - Number(a.total) - Number(pendentes.total)), recebidoAnterior: Number(a.total), dias: prazo ? Math.ceil((prazo - new Date()) / 86400000) : -1 });
        }
        const rateio = distribuirFundo(dados.valor, elegiveis);
        const insercao = await consulta('INSERT INTO receitas_solidarias (referencia,valor,autor_id,resultado) VALUES (?,?,?,?)', [referencia, dados.valor, usuario.id, JSON.stringify({ ...rateio, criterios: elegiveis })]);
        for (const d of rateio.distribuicoes) await consulta('INSERT INTO distribuicoes_solidarias (receita_id,campanha_id,valor) VALUES (?,?,?)', [insercao.insertId, d.campanha_id, d.valor]);
        for (const d of rateio.distribuicoes) await registrarMarcos(d.campanha_id, consulta);
        return { id: insercao.insertId, ...rateio };
      }));
      return ok(resultado);
    }
  }
  return null;
}
module.exports = { atenderExtensoes, imagemSegura };
