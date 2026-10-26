import type { EstadoMapa } from '../servicos/soma2';

// Cenário visual isolado. Nunca é enviado à API, à moderação ou ao fundo financeiro.
export const mapaDemonstracao: EstadoMapa[] = [
  ['SC', 'Reconstrução comunitária · exemplo', 'critica', 1850000],
  ['RS', 'Apoio a famílias · exemplo', 'moderada', 1250000],
  ['PE', 'Cuidado e saúde · exemplo', 'critica', 960000],
  ['BA', 'Alimentos para a comunidade · exemplo', 'regular', 640000],
  ['AM', 'Materiais para aprender · exemplo', 'moderada', 580000],
  ['PA', 'Acolhimento comunitário · exemplo', 'regular', 320000],
  ['GO', 'Novos começos · exemplo', 'regular', 410000],
  ['SP', 'Biblioteca comunitária · exemplo', 'regular', 290000],
  ['MG', 'Cuidado com os animais · exemplo', 'regular', 180000],
].map(([uf, titulo, classe, restante], i) => ({
  uf: String(uf), criticas: Number(classe === 'critica'), moderadas: Number(classe === 'moderada'),
  restante: Number(restante), intensidade: 0,
  campanhas: [{ id: 'demonstracao-' + i, titulo: String(titulo), categoria: ['Comunidade', 'Família', 'Saúde', 'Família', 'Educação', 'Comunidade', 'Família', 'Educação', 'Proteção animal'][i], municipio: '',
    urgencia: { classe: classe as 'critica' | 'moderada' | 'regular', revisada: classe !== 'regular' }, restante: Number(restante) }],
}));
