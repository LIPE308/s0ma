const { randomBytes, scryptSync, createHash, timingSafeEqual } = require('node:crypto');

function erro(mensagem, codigo = 400) {
  const problema = new Error(mensagem);
  problema.codigo = codigo;
  throw problema;
}

function texto(valor, nome, limite = 500, obrigatorio = true) {
  if (typeof valor !== 'string' || valor.length > limite || (obrigatorio && !valor.trim())) {
    erro(`Informe ${nome} corretamente (até ${limite} caracteres).`);
  }
  return valor.trim();
}

function inteiro(valor, nome, minimo = 1, maximo = 100000000) {
  if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) erro(`Informe ${nome} inteiro entre ${minimo} e ${maximo}.`);
  return valor;
}

function opcao(valor, opcoes, nome) {
  if (!opcoes.includes(valor)) erro(`Opção inválida para ${nome}.`);
  return valor;
}

function gerarSenha(senha, sal = randomBytes(16).toString('hex')) {
  return { sal, resumo: scryptSync(senha, sal, 64).toString('hex') };
}

function conferirSenha(senha, usuario) {
  const resumo = gerarSenha(senha, usuario.senha_sal).resumo;
  return timingSafeEqual(Buffer.from(resumo, 'hex'), Buffer.from(usuario.senha_resumo, 'hex'));
}

function resumirToken(token) { return createHash('sha256').update(token).digest('hex'); }
function usuarioPublico(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone, regiao: usuario.regiao, novidades: Boolean(usuario.novidades), administrador: Boolean(usuario.administrador) };
}

async function lerCorpo(requisicao) {
  let tamanho = 0;
  const partes = [];
  for await (const parte of requisicao) {
    tamanho += parte.length;
    if (tamanho > 100000) erro('O formulário excedeu o limite de 100 KB.', 413);
    partes.push(parte);
  }
  try {
    const dados = JSON.parse(Buffer.concat(partes).toString('utf8') || '{}');
    if (!dados || Array.isArray(dados) || typeof dados !== 'object') erro('Envie um objeto JSON.');
    return dados;
  } catch (problema) {
    if (problema.codigo) throw problema;
    erro('JSON inválido.');
  }
}

module.exports = { erro, texto, inteiro, opcao, gerarSenha, conferirSenha, resumirToken, usuarioPublico, lerCorpo };
