export const categorias = ['Família', 'Saúde', 'Educação', 'Comunidade', 'Instituições', 'Proteção animal', 'Meio ambiente', 'Cultura'];
export const formatarDinheiro = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
export function converterValor(valor: string) { return Number(valor.replace(/\s|R\$/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')); }
