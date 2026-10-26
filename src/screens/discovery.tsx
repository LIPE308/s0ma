import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Copy, EmptyState, Heading, Notice, Progress, Screen, Tag } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { useDados, usuarioLogado, type Campanha, type Necessidade, type Atualizacao } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';

export function CartaoNecessidade({ pedido, aoAbrir }: { pedido: Necessidade; aoAbrir: () => void }) {
  const restante = Math.max(0, pedido.meta - pedido.recebido - Number(pedido.reservado));
  return <Card variant="row" title={pedido.nome} subtitle={pedido.campanha + ' · ' + pedido.regiao} icon={pedido.tipo === 'tarefa' ? 'people-outline' : pedido.tipo === 'dinheiro' ? 'heart-outline' : 'gift-outline'} onPress={aoAbrir}>
    {pedido.descricao ? <Copy muted>{pedido.descricao}</Copy> : null}
    <Progress done={pedido.recebido} total={pedido.meta}/>
    <Copy muted>{pedido.tipo === 'dinheiro' ? formatarDinheiro(pedido.recebido / 100) + ' de ' + formatarDinheiro(pedido.meta / 100) + ' líquidos de teste' : pedido.recebido + ' de ' + pedido.meta + ' confirmados · ' + restante + (pedido.tipo === 'tarefa' ? ' vagas livres' : ' unidades livres')}</Copy>
  </Card>;
}

export { Inicio as Home } from './inicio';

export { ListaCampanhas as Explore } from './campanhas-lista';

export { DetalheCampanha as Campaign } from './campanha';

export function NeedDetails() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>('/necessidades/' + (id || 'cobertores')); const pedido = consulta.dados;
  const disponivel = pedido && pedido.campanha_estado === 'ativa' && (pedido.tipo === 'dinheiro' && pedido.tipo_meta === 'aberta' || pedido.meta > pedido.recebido + Number(pedido.reservado));
  const propria = pedido?.responsavel_id === usuarioLogado()?.id && !!usuarioLogado();
  return <Screen variant="detail" title="Necessidade" heading={pedido?.nome} subtitle={pedido?.campanha}><EstadoConexao {...consulta}/>{pedido ? <>
    <Tag>{disponivel ? 'DISPONÍVEL' : pedido.campanha_estado === 'encerrada' ? 'CAMPANHA ENCERRADA' : 'INDISPONÍVEL'}</Tag><Copy muted>{`Ordem sugerida pelo responsável: ${pedido.prioridade}. Não equivale a urgência verificada.`}</Copy><Copy>{pedido.descricao}</Copy>
    <Card title="Cada gesto aproxima a causa" icon={pedido.tipo === 'tarefa' ? 'people-outline' : 'heart-outline'}>
      <Progress done={pedido.recebido} total={pedido.meta}/>
      <Copy muted>{pedido.tipo === 'dinheiro' ? formatarDinheiro(pedido.recebido / 100) + ' de ' + formatarDinheiro(pedido.meta / 100) + ' líquidos de teste' : pedido.recebido + ' de ' + pedido.meta + ' confirmados · ' + Math.max(0, pedido.meta - pedido.recebido - Number(pedido.reservado)) + (pedido.tipo === 'tarefa' ? ' vagas livres' : ' unidades livres')}</Copy>
      <Button secondary title="Conhecer a campanha" onPress={() => roteador.push({ pathname: '/campanha', params: { id: pedido.campanha_id } })}/>
    </Card>
    <Heading>Como sua ajuda chega lá</Heading><Copy>{pedido.instrucoes + '\n' + pedido.regiao + '\nPrazo: ' + pedido.prazo}</Copy>
    <Copy muted>Reservar é assumir um compromisso. A realização é confirmada pelo responsável.</Copy>
    {propria ? <Notice>Você organiza esta campanha. Acompanhe as ajudas na gestão da causa.</Notice> : null}
    <Button title={pedido.tipo === 'dinheiro' ? 'Fazer doação de teste' : pedido.tipo === 'tarefa' ? 'Participar da tarefa' : 'Contribuir com este objeto'} disabled={!disponivel || propria} onPress={() => roteador.push({ pathname: pedido.tipo === 'dinheiro' ? '/doacao' : pedido.tipo === 'tarefa' ? '/voluntariado' : '/contribuir', params: { id: pedido.id } })}/>
  </> : null}</Screen>;
}

export function Updates() {
  const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const consulta = useDados<Atualizacao[]>('/campanhas/' + (campanha || 'familia') + '/atualizacoes');
  return <Screen title="Atualizações" heading="O que já aconteceu"><EstadoConexao {...consulta}/>{consulta.dados?.map(atualizacao => <Card key={atualizacao.id} title={atualizacao.titulo} subtitle={atualizacao.autor + ' · ' + new Date(atualizacao.criada_em).toLocaleDateString('pt-BR')} icon="document-text-outline"><Copy>{atualizacao.relato}</Copy></Card>)}{consulta.dados?.length === 0 ? <EmptyState title="A história continua.">O responsável ainda não publicou atualizações para esta causa.</EmptyState> : null}</Screen>;
}

export function Impact() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>('/campanhas/' + (id || 'familia'));
  return <Screen variant="detail" title="Resultado e impacto" heading="Veja o que já foi realizado." subtitle={consulta.dados?.titulo}><EstadoConexao {...consulta}/>{consulta.dados?.necessidades.map(pedido => <Card key={pedido.id} title={pedido.nome} subtitle={pedido.tipo === 'dinheiro' ? formatarDinheiro(pedido.recebido / 100) + ' líquidos de teste' : pedido.recebido + ' de ' + pedido.meta + ' confirmados'} icon="checkmark-circle-outline"><Progress done={pedido.recebido} total={pedido.meta}/></Card>)}<Copy muted>Os dados mostram as confirmações registradas. Não representam uma verificação independente da causa.</Copy></Screen>;
}
