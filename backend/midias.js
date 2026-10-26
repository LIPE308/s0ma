const { erro } = require('./auxiliares');
const MAXIMO = 2 * 1024 * 1024;
function prepararArquivo(base64, finalidade) {
  if (typeof base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length > Math.ceil(MAXIMO * 4 / 3) + 4) erro('Envie um arquivo de até 2 MB.');
  let conteudo = Buffer.from(base64, 'base64');
  if (!conteudo.length || conteudo.length > MAXIMO) erro('Envie um arquivo de até 2 MB.');
  let mime;
  const dimensoes = (largura, altura) => { if (!largura || !altura || largura > 10000 || altura > 10000 || largura * altura > 20000000) erro('Use uma imagem de até 20 megapixels, com largura e altura de até 10 mil pixels.'); };
  if (conteudo.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    mime = 'image/png';
    if (conteudo.length < 33 || conteudo.toString('ascii',12,16) !== 'IHDR' || conteudo.readUInt32BE(8) !== 13) erro('Imagem PNG inválida.');
    dimensoes(conteudo.readUInt32BE(16),conteudo.readUInt32BE(20));
    const partes = [conteudo.subarray(0, 8)];
    let offset = 8, fim = false;
    while (offset + 12 <= conteudo.length) {
      const tamanho = conteudo.readUInt32BE(offset), tipo = conteudo.toString('ascii', offset + 4, offset + 8), final = offset + 12 + tamanho;
      if (final > conteudo.length) erro('Imagem PNG inválida.');
      if (!['eXIf','tEXt','iTXt','zTXt'].includes(tipo)) partes.push(conteudo.subarray(offset, final));
      offset = final;
      if (tipo === 'IEND') { fim = true; break; }
    }
    if (!fim) erro('Imagem PNG inválida.');
    conteudo = Buffer.concat(partes);
  } else if (conteudo[0] === 255 && conteudo[1] === 216 && conteudo[2] === 255) {
    mime = 'image/jpeg';
    const partes = [conteudo.subarray(0, 2)]; let offset = 2, scan = false, formato = false;
    while (offset + 4 <= conteudo.length) {
      if (conteudo[offset] !== 255) erro('Imagem JPEG inválida.');
      const marcador = conteudo[offset + 1];
      if (marcador === 218) { partes.push(conteudo.subarray(offset)); scan = true; break; }
      const tamanho = conteudo.readUInt16BE(offset + 2);
      if (tamanho < 2 || offset + 2 + tamanho > conteudo.length) erro('Imagem JPEG inválida.');
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marcador)) { if (tamanho < 8) erro('Imagem JPEG inválida.'); dimensoes(conteudo.readUInt16BE(offset+7),conteudo.readUInt16BE(offset+5)); formato=true; }
      if (marcador < 224 || marcador > 239) partes.push(conteudo.subarray(offset, offset + 2 + tamanho));
      offset += 2 + tamanho;
    }
    if (!scan || !formato || !conteudo.subarray(-2).equals(Buffer.from([255,217]))) erro('Imagem JPEG inválida.');
    conteudo = Buffer.concat(partes);
  } else if (conteudo.subarray(0, 5).toString() === '%PDF-' && conteudo.subarray(-1024).toString().includes('%%EOF')) mime = 'application/pdf';
  else erro('Use imagem JPEG/PNG ou documento PDF válido.');
  if (finalidade !== 'documento' && mime === 'application/pdf') erro('Fotos devem ser JPEG ou PNG.');
  return { conteudo, mime };
}
function nomeSeguro(nome) {
  return String(nome || 'arquivo').replace(/[^\p{L}\p{N} ._-]/gu, '_').slice(0, 150).trim() || 'arquivo';
}
module.exports = { prepararArquivo, nomeSeguro, MAXIMO };
