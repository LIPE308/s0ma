// MySQL é o padrão. Uma DATABASE_URL antiga, sozinha, não troca o banco.
function tipoBanco(ambiente = process.env) {
  const tipo = (ambiente.BANCO_TIPO || 'mysql').trim().toLowerCase();
  if (!['mysql', 'postgres'].includes(tipo)) throw Error('BANCO_TIPO inválido. Use mysql para o SOMA local.');
  return tipo;
}
module.exports = { tipoBanco };
