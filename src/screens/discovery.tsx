import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, Field, Heading, Logo, Notice, Progress, Screen, Tag, useTheme } from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EstadoConexao } from '../components/conexao';
import { useDados, type Campanha, type Necessidade, type Atualizacao } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';

export function CartaoNecessidade({ pedido, aoAbrir, destaque = false }: { pedido: Necessidade; aoAbrir: () => void; destaque?: boolean }) {
  const livre = pedido.meta - pedido.recebido - Number(pedido.reservado);
  const restante = Math.max(0, livre);
  const restanteMeta = Math.max(0, pedido.meta - pedido.recebido);
  const titulo = !destaque ? pedido.nome : pedido.tipo === 'dinheiro' ? pedido.nome : restanteMeta > 0 ? `Faltam ${restanteMeta} ${pedido.tipo === 'tarefa' ? 'participações' : pedido.nome.toLocaleLowerCase()}` : pedido.nome;
  return <Card variant={destaque ? 'feature' : 'row'} title={titulo} subtitle={`${pedido.campanha} · ${pedido.regiao}`} icon={pedido.tipo === 'tarefa' ? 'time-outline' : pedido.tipo === 'dinheiro' ? 'wallet-outline' : 'cube-outline'} onPress={destaque ? undefined : aoAbrir}>
    <Progress done={pedido.recebido} total={pedido.meta} inverse={destaque}/>
    <Copy inverse={destaque}>{pedido.tipo === 'dinheiro' ? `${formatarDinheiro(pedido.recebido / 100)} de ${formatarDinheiro(pedido.meta / 100)} líquidos de teste` : `${pedido.recebido}/${pedido.meta} realizados · ${restante} ${pedido.tipo === 'tarefa' ? 'vagas' : 'unidades'} livres`}</Copy>
    {destaque ? <Button inverse title="Quero ajudar" onPress={aoAbrir}/> : null}
  </Card>;
}

export function Home() {
  const roteador = useRouter(); const pedidos = useDados<Necessidade[]>('/necessidades'); const campanhas = useDados<Campanha[]>('/campanhas');
  const campanha = campanhas.dados?.find(item => item.id === 'familia') || campanhas.dados?.[0];
  const destaque = pedidos.dados?.find(item => item.campanha_estado === 'ativa' && (item.meta > item.recebido + Number(item.reservado) || item.tipo === 'dinheiro' && item.tipo_meta === 'aberta'));
  const abrirPedido = (pedido: Necessidade) => roteador.push({ pathname: '/necessidade', params: { id: pedido.id } });
  return <Screen title="soma" heading="Toda ajuda encontra um caminho." subtitle="Encontre uma necessidade ao seu alcance." back={false} action={<Button title="Região" secondary onPress={() => roteador.push({ pathname: '/explorar', params: { regiao: 'abrir' } })}/>}>
    <Choices options={['Dinheiro', 'Objetos', 'Seu tempo', 'Ações']} selected="" onSelect={tipo => roteador.push({ pathname: '/explorar', params: { tipo: tipo === 'Dinheiro' ? 'R$' : tipo === 'Seu tempo' ? 'Tempo' : tipo } })}/>
    <Heading>Precisam de ajuda agora</Heading><EstadoConexao {...pedidos}/>
    {destaque ? <CartaoNecessidade pedido={destaque} destaque aoAbrir={() => abrirPedido(destaque)}/> : null}
    <Heading>Também precisam de você</Heading>
    {pedidos.dados?.filter(pedido => pedido.id !== destaque?.id).slice(0, 3).map(pedido => <CartaoNecessidade key={pedido.id} pedido={pedido} aoAbrir={() => abrirPedido(pedido)}/>)}
    {pedidos.dados?.length === 0 ? <Notice>Nenhum pedido disponível por enquanto.</Notice> : null}
    <Heading>Campanha da sua região</Heading><EstadoConexao {...campanhas}/>
    {campanha ? <Card title={campanha.titulo} subtitle={campanha.regiao} icon="people-outline" onPress={() => roteador.push({ pathname: '/campanha', params: { id: campanha.id } })}/> : null}
    <Button secondary title="Conhecer todas as campanhas" onPress={() => roteador.push('/explorar')}/>
  </Screen>;
}

export function Explore() {
  const { s } = useTheme();
  const insets = useSafeAreaInsets();
  const roteador = useRouter(); const parametros = useLocalSearchParams<{ tipo?: string; regiao?: string }>();
  const pedidos = useDados<Necessidade[]>('/necessidades'); const campanhas = useDados<Campanha[]>('/campanhas');
  const [busca, definirBusca] = useState(''); const [secao, definirSecao] = useState(parametros.tipo === 'Ações' ? 'Ações' : 'Necessidades');
  const [tipo, definirTipo] = useState(parametros.tipo && parametros.tipo !== 'Ações' ? parametros.tipo : 'Todos');
  const [regiao, definirRegiao] = useState('Todas as regiões'); const [regiaoEscolhida, definirRegiaoEscolhida] = useState(regiao);
  const [janela, definirJanela] = useState(parametros.regiao === 'abrir');
  const termo = busca.toLocaleLowerCase().trim();
  const tipoBanco = tipo === 'Objetos' ? 'objeto' : tipo === 'Tempo' ? 'tarefa' : 'dinheiro';
  const lista = (pedidos.dados || []).filter(pedido => (tipo === 'Todos' || pedido.tipo === tipoBanco) && (regiao === 'Todas as regiões' || pedido.regiao === regiao) && `${pedido.nome} ${pedido.campanha}`.toLocaleLowerCase().includes(termo));
  const listaCampanhas = (campanhas.dados || []).filter(campanha => (regiao === 'Todas as regiões' || campanha.regiao === regiao) && `${campanha.titulo} ${campanha.descricao} ${campanha.evento}`.toLocaleLowerCase().includes(termo) && (secao !== 'Ações' || !!campanha.evento));
  const regioes = ['Todas as regiões', ...new Set((campanhas.dados || []).map(campanha => campanha.regiao))];
  return <View style={s.screen}><FlatList keyboardShouldPersistTaps="handled" data={secao === 'Necessidades' ? lista : []} keyExtractor={pedido => pedido.id} contentContainerStyle={[s.content, { paddingTop: Math.max(24, insets.top + 12), paddingBottom: Math.max(32, insets.bottom + 20) }]} ItemSeparatorComponent={() => <View style={{ height: 4 }}/>}
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 18 }}><Text style={s.demoText}>PROJETO ACADÊMICO · SOMA</Text><Logo/><Text accessibilityRole="header" style={s.heading}>Explorar</Text>
      <Field label="Buscar campanhas ou necessidades" value={busca} onChangeText={definirBusca} placeholder="O que você procura?"/>
      <Choices options={['Campanhas', 'Necessidades', 'Ações']} selected={secao} onSelect={definirSecao}/><Button secondary title={`Região: ${regiao}`} onPress={() => { definirRegiaoEscolhida(regiao); definirJanela(true); }}/>
      <EstadoConexao {...(secao === 'Necessidades' ? pedidos : campanhas)}/>
      {secao === 'Necessidades' ? <><Choices options={['Todos', 'Objetos', 'Tempo', 'R$']} selected={tipo} onSelect={definirTipo}/><Copy muted>{lista.length} resultados</Copy></> : null}
    </View>}
    renderItem={({ item }) => <CartaoNecessidade pedido={item} aoAbrir={() => roteador.push({ pathname: '/necessidade', params: { id: item.id } })}/>}
    ListEmptyComponent={secao !== 'Necessidades' ? <View style={{ gap: 16 }}>{listaCampanhas.map(campanha => <Card key={campanha.id} title={secao === 'Ações' ? campanha.evento : campanha.titulo} subtitle={campanha.regiao} icon={secao === 'Ações' ? 'calendar-outline' : 'people-outline'} onPress={() => roteador.push({ pathname: secao === 'Ações' ? '/acao' : '/campanha', params: { id: campanha.id } })}/>)}{!listaCampanhas.length && !campanhas.carregando ? <Notice>Nenhum resultado. Tente outra busca ou região.</Notice> : null}</View> : !pedidos.carregando && !pedidos.erro ? <Notice>Nenhuma necessidade encontrada. Tente outro termo ou filtro.</Notice> : null}
  /><Dialog visible={janela} title="Escolha sua região" onClose={() => definirJanela(false)}><Choices options={regioes} selected={regiaoEscolhida} onSelect={definirRegiaoEscolhida}/><Button title="Aplicar região" onPress={() => { definirRegiao(regiaoEscolhida); definirJanela(false); }}/></Dialog></View>;
}

export function Campaign() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'familia'}`); const campanha = consulta.dados;
  const [responsavelVisivel, definirResponsavelVisivel] = useState(false);
  return <Screen variant="detail" title="Campanha" heading={campanha?.titulo} subtitle={campanha ? `${campanha.categoria} · ${campanha.regiao}` : ''}>
    <EstadoConexao {...consulta}/>{campanha ? <>
      <Tag>{campanha.estado.toLocaleUpperCase()}</Tag><Card title="A história desta causa" icon="people-outline"><Copy>{campanha.descricao}</Copy><Copy muted>{campanha.responsavel} · responsável</Copy></Card><Heading>O que está faltando</Heading>
      {campanha.necessidades.map(pedido => <CartaoNecessidade key={pedido.id} pedido={pedido} aoAbrir={() => roteador.push({ pathname: '/necessidade', params: { id: pedido.id } })}/>)}
      {campanha.evento ? <Card title={campanha.evento} icon="calendar-outline" onPress={() => roteador.push({ pathname: '/acao', params: { id: campanha.id } })}/> : null}
      <Button secondary title="Atualizações" onPress={() => roteador.push({ pathname: '/atualizacoes', params: { campanha: campanha.id } })}/>
      <Button secondary title={responsavelVisivel ? 'Ocultar responsável' : 'Conhecer responsável'} onPress={() => definirResponsavelVisivel(!responsavelVisivel)}/>
      {responsavelVisivel ? <Card title={campanha.responsavel} subtitle={campanha.regiao} icon="person-outline"><Copy>{campanha.instrucoes}</Copy></Card> : null}
      <Button secondary title="Denunciar campanha" onPress={() => roteador.push({ pathname: '/denunciar', params: { id: campanha.id } })}/>
      <Button secondary title="Resultado e impacto" onPress={() => roteador.push({ pathname: '/resultado', params: { id: campanha.id } })}/>
    </> : null}
  </Screen>;
}

export function NeedDetails() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'cobertores'}`); const pedido = consulta.dados;
  const disponivel = pedido && pedido.campanha_estado === 'ativa' && (pedido.tipo === 'dinheiro' && pedido.tipo_meta === 'aberta' || pedido.meta > pedido.recebido + Number(pedido.reservado));
  return <Screen variant="detail" title="Necessidade" heading={pedido?.nome} subtitle={pedido?.campanha}><EstadoConexao {...consulta}/>{pedido ? <>
    <Tag>{disponivel ? 'DISPONÍVEL' : 'INDISPONÍVEL'} · {pedido.prioridade.toLocaleUpperCase()}</Tag><Copy>{pedido.descricao}</Copy>
    <Card variant="feature" title="Cada contribuição aproxima a meta" icon={pedido.tipo === 'tarefa' ? 'time-outline' : pedido.tipo === 'dinheiro' ? 'wallet-outline' : 'cube-outline'}>
      <Progress done={pedido.recebido} total={pedido.meta} inverse/>
      <Copy inverse>{pedido.tipo === 'dinheiro' ? `${formatarDinheiro(pedido.recebido / 100)} de ${formatarDinheiro(pedido.meta / 100)} líquidos de teste` : `${pedido.recebido} de ${pedido.meta} realizados · ${Math.max(0, pedido.meta - pedido.recebido - Number(pedido.reservado))} ${pedido.tipo === 'tarefa' ? 'vagas' : 'unidades'} livres`}</Copy>
      <Button inverse title="Conhecer a campanha" onPress={() => roteador.push({ pathname: '/campanha', params: { id: pedido.campanha_id } })}/>
    </Card>
    <Heading>Instruções da ajuda</Heading><Copy>{pedido.instrucoes}{'\n'}{pedido.regiao}{'\n'}Prazo: {pedido.prazo}</Copy>
    <Copy muted>Reservado não significa recebido. O responsável confirma a realização.</Copy>
    <Button title={pedido.tipo === 'dinheiro' ? 'Fazer doação de teste' : pedido.tipo === 'tarefa' ? 'Participar da tarefa' : 'Contribuir com este objeto'} disabled={!disponivel} onPress={() => roteador.push({ pathname: pedido.tipo === 'dinheiro' ? '/doacao' : pedido.tipo === 'tarefa' ? '/voluntariado' : '/contribuir', params: { id: pedido.id } })}/>
  </> : null}</Screen>;
}

export function Updates() {
  const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const consulta = useDados<Atualizacao[]>(`/campanhas/${campanha || 'familia'}/atualizacoes`);
  return <Screen title="Atualizações" heading="O que já aconteceu"><EstadoConexao {...consulta}/>{consulta.dados?.map(atualizacao => <Card key={atualizacao.id} title={atualizacao.titulo} subtitle={`${atualizacao.autor} · ${new Date(atualizacao.criada_em).toLocaleDateString('pt-BR')}`} icon="document-text-outline"><Copy>{atualizacao.relato}</Copy></Card>)}{consulta.dados?.length === 0 ? <Notice>Nenhuma atualização publicada por enquanto.</Notice> : null}</Screen>;
}

export function Impact() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'familia'}`);
  return <Screen variant="detail" title="Resultado e impacto" heading="Veja o que já foi realizado." subtitle={consulta.dados?.titulo}><EstadoConexao {...consulta}/>{consulta.dados?.necessidades.map(pedido => <Card key={pedido.id} title={pedido.nome} subtitle={pedido.tipo === 'dinheiro' ? `${formatarDinheiro(pedido.recebido / 100)} líquidos de teste` : `${pedido.recebido} de ${pedido.meta} realizados`} icon="checkmark-circle-outline"><Progress done={pedido.recebido} total={pedido.meta}/></Card>)}<Copy muted>Os dados mostram as confirmações registradas. Não representam uma verificação independente da causa.</Copy></Screen>;
}
