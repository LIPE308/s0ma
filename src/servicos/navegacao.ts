import type { Href } from 'expo-router';

const rotasDeRetorno = new Set(['/rota','/rota-inteligente','/minhas-campanhas','/personalizar-perfil','/convidar','/compartilhamentos','/preparar-campanha','/urgencia','/configuracoes','/meus-dados','/', '/explorar', '/criar', '/atividade', '/perfil', '/campanha', '/necessidade', '/contribuir', '/voluntariado', '/acao', '/revisar-ajuda', '/ajuda', '/doacao', '/pagamento', '/avisos', '/pedidos', '/editar-necessidade', '/organizacao', '/revisao', '/gerenciar', '/confirmar', '/publicar', '/denunciar', '/saldo', '/solicitar-repasse', '/repasse', '/administracao', '/analise', '/operacao']);

export function destinoAposLogin(retorno?: string): Href {
  if (retorno && rotasDeRetorno.has(retorno.split('?')[0]) && !retorno.includes('#')) return retorno as Href;
  return '/';
}
