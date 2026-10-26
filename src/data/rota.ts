import type { Marco } from '../components/estrada-base';
export function iconeDoObjetivo(titulo: string, categoria = '') {
  const objetivo = titulo.toLocaleLowerCase();
  if (/playstation|ps5|videogame|console|xbox/.test(objetivo)) return 'console';
  if (/livro|biblioteca|escola|curso|estud/.test(objetivo) || categoria === 'Educação') return 'livro';
  if (/casa|moradia|reforma|família/.test(objetivo) || categoria === 'Família') return 'casa';
  if (/cirurgia|tratamento|saúde|medic|hospital/.test(objetivo) || categoria === 'Saúde') return 'saude';
  if (/animal|abrigo|cachorr|gato/.test(objetivo) || categoria === 'Proteção animal') return 'animal';
  if (/árvore|floresta|plantar|natureza/.test(objetivo) || categoria === 'Meio ambiente') return 'arvore';
  if (/alimento|comida|cesta/.test(objetivo)) return 'alimentos';
  return 'objetivo';
}
// A estrada principal tem somente cinco marcos financeiros. Os demais continuam no histórico.
export function marcosDaEstrada(marcos: Marco[], titulo: string, categoria = '') {
  const principais = marcos.filter(m => m.id.startsWith('financeiro-') && m.id !== 'financeiro-1');
  return principais.map((m, i) => ({ ...m, titulo: i === principais.length - 1 ? titulo : i === 0 ? 'Seu primeiro passo' : m.titulo, icone: i === principais.length - 1 ? iconeDoObjetivo(titulo, categoria) : i === 0 ? 'coracao' : 'moedas' }));
}
export function indiceAtual(marcos: Marco[]) { const i = marcos.findIndex(m => !m.concluido); return i < 0 ? Math.max(0, marcos.length - 1) : i; }
