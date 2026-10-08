// MySQL do projeto no Windows: sem serviço do sistema e sem depender do Docker.
const { spawn } = require('node:child_process');
const { randomBytes, createHash } = require('node:crypto');
const { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, createReadStream } = require('node:fs');
const { join, resolve } = require('node:path');
const net = require('node:net');
const mysql = require('mysql2/promise');

const versao = '8.4.8';
const hashZip = '53685bb61a1efc5ecc1b35c1b6bd0d30ba799f4943a1ef2c34df464f5a774c7f';
const diretorio = join(__dirname, '.mysql');
const instalacao = join(diretorio, `mysql-${versao}-winx64`);
const dados = join(diretorio, 'dados');
const arquivoConfiguracao = join(diretorio, 'configuracao.json');
const arquivoEnv = join(__dirname, '.env');
const arquivoLog = join(diretorio, 'mysql.log');
const esperar = ms => new Promise(concluir => setTimeout(concluir, ms));

function executar(programa, argumentos, opcoes = {}) {
  return new Promise((concluir, rejeitar) => {
    const filho = spawn(programa, argumentos, { windowsHide: true, stdio: 'inherit', ...opcoes });
    filho.once('error', rejeitar);
    filho.once('exit', codigo => codigo === 0 ? concluir() : rejeitar(new Error(`${programa} encerrou com código ${codigo}.`)));
  });
}

async function calcularHash(arquivo) {
  const hash = createHash('sha256');
  for await (const trecho of createReadStream(arquivo)) hash.update(trecho);
  return hash.digest('hex');
}

async function instalar() {
  if (existsSync(join(instalacao, 'bin', 'mysqld.exe'))) return;
  const zip = join(diretorio, `mysql-${versao}-winx64.zip`);
  if (!existsSync(zip)) {
    console.log(`Baixando MySQL ${versao} do site oficial (aproximadamente 248 MB)...`);
    await executar('curl.exe', ['--fail', '--location', '--retry', '2', '--output', zip,
      `https://cdn.mysql.com/archives/mysql-8.4/mysql-${versao}-winx64.zip`]);
  }
  if (await calcularHash(zip) !== hashZip) {
    throw new Error(`O ZIP não passou na verificação SHA-256. Remova somente o arquivo ${zip} e tente novamente.`);
  }
  console.log('Extraindo o pacote verificado...');
  await executar('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    '$ErrorActionPreference="Stop"; Expand-Archive -LiteralPath $env:SOMA_MYSQL_ZIP -DestinationPath $env:SOMA_MYSQL_DESTINO -Force'],
  { env: { ...process.env, SOMA_MYSQL_ZIP: zip, SOMA_MYSQL_DESTINO: diretorio } });
}

function carregarConfiguracao() {
  if (!existsSync(arquivoConfiguracao)) throw new Error('Execute npm run banco:local primeiro.');
  return JSON.parse(readFileSync(arquivoConfiguracao, 'utf8'));
}

function processoAtivo(pid) {
  try { process.kill(pid, 0); return true; } catch (problema) {
    if (problema.code === 'ESRCH') return false;
    throw problema;
  }
}

async function conectar(configuracao) {
  const conexao = await mysql.createConnection({ host: '127.0.0.1', port: configuracao.porta,
    user: 'root', password: configuracao.senhaRoot, connectTimeout: 1500 });
  try {
    const [linhas] = await conexao.query('SELECT @@datadir AS diretorio, VERSION() AS versao');
    if (resolve(linhas[0].diretorio).toLowerCase() !== resolve(dados).toLowerCase()) {
      throw new Error('A porta responde com outro MySQL. Nenhuma alteração foi realizada nele.');
    }
    return { conexao, versao: linhas[0].versao };
  } catch (problema) { await conexao.end(); throw problema; }
}

async function portaOcupada(porta) {
  return new Promise(concluir => {
    const socket = net.createConnection({ host: '127.0.0.1', port: porta });
    const terminar = resultado => { socket.destroy(); concluir(resultado); };
    socket.once('connect', () => terminar(true));
    socket.once('error', () => terminar(false));
    socket.setTimeout(1500, () => terminar(false));
  });
}

function conferirEnv(configuracao) {
  if (!existsSync(arquivoEnv)) return;
  const conteudo = readFileSync(arquivoEnv, 'utf8');
  const valores = Object.fromEntries(conteudo.split(/\r?\n/).filter(linha => /^[A-Z_]+=/.test(linha)).map(linha => {
    const indice = linha.indexOf('='); return [linha.slice(0, indice), linha.slice(indice + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
  }));
  if (!configuracao || valores.MYSQL_HOST !== '127.0.0.1' || valores.MYSQL_PORTA !== String(configuracao.porta) ||
      valores.MYSQL_USUARIO !== 'soma' || valores.MYSQL_BANCO !== 'soma' || valores.MYSQL_SENHA !== configuracao.senhaSoma) {
    throw new Error('backend/.env já configura outro banco. Ele foi preservado. Use esse MySQL ou guarde a configuração em outro arquivo antes de escolher o banco local.');
  }
}

async function iniciar() {
  let configuracao = existsSync(arquivoConfiguracao) ? carregarConfiguracao() : null;
  conferirEnv(configuracao);
  mkdirSync(diretorio, { recursive: true });
  if (!configuracao) {
    configuracao = { porta: 3307, senhaRoot: randomBytes(24).toString('hex'), senhaSoma: randomBytes(24).toString('hex'), preparado: false };
    writeFileSync(arquivoConfiguracao, JSON.stringify(configuracao, null, 2), { flag: 'wx' });
  }
  let conectado;
  if (await portaOcupada(configuracao.porta)) {
    conectado = await conectar(configuracao);
  } else {
    await instalar();
    const executavel = join(instalacao, 'bin', 'mysqld.exe');
    const argumentos = ['--no-defaults', `--basedir=${instalacao}`, `--datadir=${dados}`];
    if (!existsSync(dados)) {
      console.log('Inicializando arquivos do MySQL dentro do projeto...');
      await executar(executavel, [...argumentos, '--initialize-insecure', '--console']);
    }
    const arquivoInicial = join(diretorio, 'inicializar.sql');
    if (!configuracao.preparado) {
      // O init-file define a senha antes de o servidor aceitar conexões.
      writeFileSync(arquivoInicial, `ALTER USER 'root'@'localhost' IDENTIFIED BY '${configuracao.senhaRoot}';\n`);
    }
    const filho = spawn(executavel, [...argumentos, '--bind-address=127.0.0.1', `--port=${configuracao.porta}`,
      '--mysqlx=0', '--character-set-server=utf8mb4', '--collation-server=utf8mb4_unicode_ci',
      `--log-error=${arquivoLog}`, ...(!configuracao.preparado ? [`--init-file=${arquivoInicial}`] : [])],
    { detached: true, windowsHide: true, stdio: 'ignore' });
    let falha;
    filho.once('error', problema => { falha = problema; });
    filho.unref();
    for (let tentativa = 0; tentativa < 90; tentativa++) {
      if (falha) throw falha;
      try { conectado = await conectar(configuracao); break; } catch (problema) {
        if (filho.exitCode !== null) throw new Error(`MySQL não iniciou. Confira ${arquivoLog}. ${problema.message}`);
        await esperar(1000);
      }
    }
    if (!conectado) throw new Error(`MySQL não respondeu em 90 segundos. Confira ${arquivoLog}.`);
    if (existsSync(arquivoInicial)) unlinkSync(arquivoInicial);
  }
  try {
    await conectado.conexao.query('CREATE DATABASE IF NOT EXISTS soma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conectado.conexao.query("CREATE USER IF NOT EXISTS 'soma'@'localhost' IDENTIFIED BY ?", [configuracao.senhaSoma]);
    await conectado.conexao.query("GRANT ALL PRIVILEGES ON soma.* TO 'soma'@'localhost'");
    const aplicacao = await mysql.createConnection({ host: '127.0.0.1', port: configuracao.porta,
      user: 'soma', password: configuracao.senhaSoma, database: 'soma', connectTimeout: 3000 });
    try { await aplicacao.query('SELECT 1'); } finally { await aplicacao.end(); }
    configuracao.preparado = true;
    writeFileSync(arquivoConfiguracao, JSON.stringify(configuracao, null, 2));
    if (!existsSync(arquivoEnv)) {
      writeFileSync(arquivoEnv, `# Gerado por npm run banco:local. Somente desenvolvimento local.\nMYSQL_HOST=127.0.0.1\nMYSQL_PORTA=${configuracao.porta}\nMYSQL_USUARIO=soma\nMYSQL_SENHA=${configuracao.senhaSoma}\nMYSQL_BANCO=soma\nPORTA=3001\nENDERECO=127.0.0.1\n`, { flag: 'wx' });
    }
    console.log(`MySQL ${conectado.versao} pronto em 127.0.0.1:${configuracao.porta}. Banco soma criado; backend/.env configurado.`);
    console.log('Execute npm run servidor. Os dados permanecem ao reiniciar.');
  } finally { await conectado.conexao.end(); }
}

async function main() {
  if (process.platform !== 'win32') throw new Error('Este comando é para Windows x64. Em outros sistemas use npm run banco:iniciar ou um MySQL instalado.');
  const acao = process.argv[2] || 'iniciar';
  if (acao === 'iniciar') return iniciar();
  const configuracao = carregarConfiguracao();
  if (acao === 'testar') {
    const { conexao } = await conectar(configuracao); await conexao.end();
    return executar(process.execPath, ['--test', join(__dirname, 'testes.test.js')], {
      cwd: join(__dirname, '..'), env: { ...process.env, MYSQL_HOST: '127.0.0.1', MYSQL_PORTA: String(configuracao.porta),
        MYSQL_TESTE_USUARIO: 'root', MYSQL_TESTE_SENHA: configuracao.senhaRoot },
    });
  }
  if (!['parar', 'estado'].includes(acao)) throw new Error('Ação inválida: use iniciar, parar, estado ou testar.');
  if (!await portaOcupada(configuracao.porta)) { console.log('MySQL local está parado.'); return; }
  const { conexao, versao: versaoAtiva } = await conectar(configuracao);
  try {
    if (acao === 'estado') console.log(`MySQL ${versaoAtiva} ativo em 127.0.0.1:${configuracao.porta}; dados em ${dados}.`);
    else {
      const [linhas] = await conexao.query('SELECT @@pid_file AS arquivo');
      const pid = Number(readFileSync(linhas[0].arquivo, 'utf8').trim());
      if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Não foi possível identificar o processo do MySQL local.');
      await conexao.query('SHUTDOWN');
      // A porta fecha antes de o InnoDB liberar os arquivos. Aguarde o processo.
      for (let tentativa = 0; tentativa < 60; tentativa++) {
        if (!processoAtivo(pid)) { console.log('MySQL local parado. Os dados foram preservados.'); return; }
        await esperar(500);
      }
      throw new Error('Encerramento solicitado, mas o processo ainda está ativo. Confira o log antes de iniciar novamente.');
    }
  } finally { await conexao.end(); }
}

main().catch(problema => { console.error(problema.message); process.exitCode = 1; });
