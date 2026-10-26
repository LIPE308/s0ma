export const categorias = ['Família', 'Saúde', 'Educação', 'Comunidade', 'Instituições', 'Proteção animal', 'Meio ambiente', 'Cultura', 'Necessidades pessoais', 'Objetivos individuais', 'Outras causas'];
const moedaBrasileira = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatarDinheiro = (valor: number) => moedaBrasileira.format(valor);
export function converterValor(valor: string) { return Number(valor.replace(/\s|R\$/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')); }
