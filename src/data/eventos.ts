export type DetalhesEvento = { nome: string; data: string; horario: string; local: string };

export function lerEvento(texto: string): DetalhesEvento | null {
  const valores = Object.fromEntries(texto.split('\n').map(linha => { const separador = linha.indexOf(': '); return [linha.slice(0, separador), linha.slice(separador + 2)]; }));
  if (!valores.Encontro || !valores.Data || !valores.Horário || !valores.Local) return null;
  return { nome: valores.Encontro, data: valores.Data, horario: valores.Horário, local: valores.Local };
}

export function dataDeEventoValida(valor: string) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return false;
  const dia = Number(partes[1]); const mes = Number(partes[2]); const ano = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return ano >= 2020 && data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function formatarEvento(evento: DetalhesEvento) {
  const limpar = (valor: string) => valor.trim().replace(/\s+/g, ' ');
  return 'Encontro: ' + limpar(evento.nome) + '\nData: ' + limpar(evento.data) + '\nHorário: ' + limpar(evento.horario) + '\nLocal: ' + limpar(evento.local);
}
