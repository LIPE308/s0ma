export const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function lerData(valor: string): Date | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return null;
  const [, dia, mes, ano] = partes.map(Number);
  const data = new Date(ano, mes - 1, dia, 12);
  return ano >= 1900 && ano <= 2200 && data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}
export function escreverData(data: Date) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}
export function inicioDoDia(data = new Date()) { return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12); }
export function diasDoMes(ano: number, mes: number) {
  const inicio = new Date(ano, mes, 1, 12).getDay();
  const quantidade = new Date(ano, mes + 1, 0, 12).getDate();
  return Array.from({ length: Math.ceil((inicio + quantidade) / 7) * 7 }, (_, i) => i < inicio || i >= inicio + quantidade ? null : i - inicio + 1);
}
