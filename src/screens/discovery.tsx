import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Share, Text, View, useWindowDimensions } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, Disclosure, EmptyState, Field, Heading, Logo, Notice, Progress, Screen, Tag, useTheme } from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EstadoConexao } from '../components/conexao';
import { useDados, usuarioLogado, type Campanha, type Necessidade, type Atualizacao } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
import { FotoDeAcolhimento, FotoDeCampanha } from '../components/fotos';
import { CartaoCampanha } from '../components/campanhas';
import { ContentMotion, MotionPressable } from '../design/motion';
import { radius } from '../design/theme';
import type { Inteligencia } from './inteligencia';
import { RotaConvite } from '../components/rota-convite';
import { Image } from 'expo-image';
import { requisitar } from '../servicos/api';

export function CartaoNecessidade({ pedido, aoAbrir }: { pedido: Necessidade; aoAbrir: () => void }) {
  const restante = Math.max(0, pedido.meta - pedido.recebido - Number(pedido.reservado));
  return <Card variant="row" title={pedido.nome} subtitle={pedido.campanha + ' · ' + pedido.regiao} icon={pedido.tipo === 'tarefa' ? 'people-outline' : pedido.tipo === 'dinheiro' ? 'heart-outline' : 'gift-outline'} onPress={aoAbrir}>
    {pedido.descricao ? <Copy muted>{pedido.descricao}</Copy> : null}
    <Progress done={pedido.recebido} total={pedido.meta}/>
    <Copy muted>{pedido.tipo === 'dinheiro' ? formatarDinheiro(pedido.recebido / 100) + ' de ' + formatarDinheiro(pedido.meta / 100) + ' líquidos de teste' : pedido.recebido + ' de ' + pedido.meta + ' confirmados · ' + restante + (pedido.tipo === 'tarefa' ? ' vagas livres' : ' unidades livres')}</Copy>
  </Card>;
}

export function Home() {
  const roteador = useRouter(); const { s, colors } = useTheme(); const { width } = useWindowDimensions();
  const pedidos = useDados<Necessidade[]>('/necessidades'); const campanhas = useDados<Campanha[]>('/campanhas');
  const minhas = useDados<Campanha[]>(usuarioLogado() ? '/campanhas?minhas=1' : null);
  const ativas = campanhas.dados?.filter(campanha => campanha.estado === 'ativa') || [];
  const familia = ativas.find(campanha => campanha.id === 'familia');
  const historias = (familia ? [familia, ...ativas.filter(campanha => campanha.id !== familia.id)] : ativas).slice(0, 2);
  const explorar = (secao: string, tipo = 'Todos') => roteador.push({ pathname: '/explorar', params: { secao, tipo, entrada: String(Date.now()) } });
  const atalhos = [
    { titulo: 'Fazer uma doação', icon: 'gift-outline' as const, onPress: () => explorar('Necessidades') },
    { titulo: 'Ser voluntário', icon: 'people-outline' as const, onPress: () => explorar('Voluntariado', 'Tempo') },
    { titulo: 'Eventos sociais', icon: 'calendar-outline' as const, onPress: () => explorar('Eventos') },
    { titulo: 'Criar campanha', icon: 'add-circle-outline' as const, onPress: () => roteador.push('/criar') },
    { titulo: 'Mapa Solidário', icon: 'map-outline' as const, onPress: () => roteador.push('/mapa') },
    { titulo: 'Minhas rotas', icon: 'navigate-outline' as const, onPress: () => roteador.push('/rotas') },
  ];
  return <Screen title="soma" back={false} action={<Button title="Região" secondary onPress={() => roteador.push({ pathname: '/explorar', params: { secao: 'Campanhas', regiao: 'abrir', entrada: String(Date.now()) } })}/>}>
    {minhas.dados?.length ? <Card title="Continue o caminho da sua campanha" subtitle={minhas.dados[0].titulo} icon="navigate-outline" onPress={() => roteador.push('/rotas')}/> : null}
    <FotoDeAcolhimento aoEncontrar={() => explorar('Campanhas')}/>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{atalhos.map(atalho => <MotionPressable key={atalho.titulo} containerStyle={{ flexBasis: '47%', flexGrow: 1 }} accessibilityRole="button" accessibilityLabel={atalho.titulo} onPress={atalho.onPress} style={({ pressed }) => [{ minHeight: 88, borderRadius: radius.card, backgroundColor: colors.gentle, padding: 14, gap: 8 }, pressed && s.pressed]}><Ionicons name={atalho.icon} size={24} color={colors.gentleInk}/><Text style={[s.cardSubtitle, { color: colors.ink, fontSize: 13, lineHeight: 19 }]}>{atalho.titulo}</Text></MotionPressable>)}</View>
    <View style={{ gap: 5 }}><Heading>Histórias para somar</Heading><Copy muted>Conheça a causa. Escolha um gesto que esteja ao seu alcance.</Copy></View>
    <EstadoConexao {...campanhas}/>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{historias.map(campanha => <View key={campanha.id} style={{ flexBasis: width >= 680 ? '47%' : '100%', flexGrow: 1 }}><CartaoCampanha campanha={campanha} pedido={pedidos.dados?.find(pedido => pedido.campanha_id === campanha.id && pedido.tipo !== 'dinheiro')} aoAbrir={() => roteador.push({ pathname: '/campanha', params: { id: campanha.id } })}/></View>)}</View>
    {!campanhas.carregando && !campanhas.erro && !historias.length ? <EmptyState title="Toda causa começa com alguém." action="Criar uma campanha" onPress={() => roteador.push('/criar')}>Ainda não há campanhas ativas por aqui.</EmptyState> : null}
    <Button secondary title="Conhecer todas as campanhas" onPress={() => explorar('Campanhas')}/>
    <Card title="Mapa solidário do Brasil" subtitle="Descubra campanhas por estado, categoria e urgência verificada" icon="map-outline" onPress={() => roteador.push('/mapa')}/>
    <Heading>Pequenos gestos, ajuda concreta</Heading><EstadoConexao {...pedidos}/>
    {pedidos.dados?.filter(pedido => pedido.tipo !== 'dinheiro' && pedido.meta > pedido.recebido + Number(pedido.reservado)).slice(0, 3).map(pedido => <CartaoNecessidade key={pedido.id} pedido={pedido} aoAbrir={() => roteador.push({ pathname: '/necessidade', params: { id: pedido.id } })}/>)}
    {!pedidos.carregando && !pedidos.erro && pedidos.dados?.length === 0 ? <EmptyState title="Novas oportunidades podem chegar.">Você pode conhecer as histórias da comunidade enquanto isso.</EmptyState> : null}
  </Screen>;
}

type ItemExplorar = { tipo: 'pedido'; dados: Necessidade } | { tipo: 'campanha'; dados: Campanha };

export function Explore() {
  const { s } = useTheme(); const insets = useSafeAreaInsets(); const roteador = useRouter();
  const parametros = useLocalSearchParams<{ tipo?: string; secao?: string; regiao?: string; entrada?: string }>();
  const pedidos = useDados<Necessidade[]>('/necessidades'); const campanhas = useDados<Campanha[]>('/campanhas');
  const [busca, definirBusca] = useState(''); const [secao, definirSecao] = useState('Campanhas'); const [tipo, definirTipo] = useState('Todos');
  const [regiao, definirRegiao] = useState('Todas as regiões'); const [regiaoEscolhida, definirRegiaoEscolhida] = useState(regiao);
  const [categoria, definirCategoria] = useState('Todas'); const [categoriaEscolhida, definirCategoriaEscolhida] = useState(categoria);
  const [janela, definirJanela] = useState(false);
  const [urgencia, definirUrgencia] = useState('Todas'); const [verificadas, definirVerificadas] = useState('Todas'); const [ordem, definirOrdem] = useState('Equilibradas'); const [valorMaximo, definirValorMaximo] = useState('');
  useEffect(() => {
    const destino = parametros.secao || (parametros.tipo === 'Ações' ? 'Eventos' : parametros.tipo ? 'Necessidades' : 'Campanhas');
    definirSecao(['Campanhas', 'Necessidades', 'Voluntariado', 'Eventos'].includes(destino) ? destino : 'Campanhas');
    definirTipo(['Objetos', 'Tempo', 'R$'].includes(parametros.tipo || '') ? parametros.tipo! : 'Todos');
    definirBusca('');
    if (parametros.regiao === 'abrir') definirJanela(true);
  }, [parametros.tipo, parametros.secao, parametros.regiao, parametros.entrada]);
  const termo = busca.toLocaleLowerCase().trim(); const mostrarPedidos = secao === 'Necessidades' || secao === 'Voluntariado';
  const tipoBanco = secao === 'Voluntariado' || tipo === 'Tempo' ? 'tarefa' : tipo === 'Objetos' ? 'objeto' : 'dinheiro';
  const lista = (pedidos.dados || []).filter(pedido => (secao === 'Voluntariado' || tipo !== 'Todos' ? pedido.tipo === tipoBanco : true) && (regiao === 'Todas as regiões' || pedido.regiao === regiao) && (pedido.nome + ' ' + pedido.campanha + ' ' + pedido.descricao).toLocaleLowerCase().includes(termo));
  const prazoNumerico = (c: Campanha) => { if (!c.prazo) return Number.MAX_SAFE_INTEGER; const [d, m, a] = c.prazo.split('/').map(Number); return Date.UTC(a, m - 1, d); };
  const progresso = (c: Campanha) => Number(c.meta_financeira) > 0 ? Number(c.recebido_financeiro) / Number(c.meta_financeira) : 0;
  const listaCampanhas = (campanhas.dados || []).filter(campanha => (regiao === 'Todas as regiões' || campanha.regiao === regiao) && (categoria === 'Todas' || campanha.categoria === categoria) && (urgencia === 'Todas' || ({regular:'Regular',moderada:'Moderada',critica:'Crítica'}[campanha.urgencia?.classe||'regular'] === urgencia)) && (verificadas === 'Todas' || !!campanha.urgencia?.revisada) && (!valorMaximo || Number.isFinite(Number(valorMaximo.replace(',', '.'))) && Number(campanha.meta_financeira) <= Number(valorMaximo.replace(',', '.')) * 100) && (campanha.titulo + ' ' + campanha.descricao + ' ' + campanha.evento + ' ' + campanha.categoria).toLocaleLowerCase().includes(termo) && (secao !== 'Eventos' || !!campanha.evento)).sort((a, b) => ordem === 'Equilibradas' ? 0 : ordem === 'Prazo próximo' ? prazoNumerico(a) - prazoNumerico(b) : ordem === 'Perto da meta' ? progresso(b) - progresso(a) : new Date(b.criada_em || 0).getTime() - new Date(a.criada_em || 0).getTime());
  const regioes = ['Todas as regiões', ...new Set((campanhas.dados || []).map(campanha => campanha.regiao))];
  const categorias = ['Todas', ...new Set((campanhas.dados || []).map(campanha => campanha.categoria))];
  const itens: ItemExplorar[] = mostrarPedidos ? lista.map(dados => ({ tipo: 'pedido', dados })) : listaCampanhas.map(dados => ({ tipo: 'campanha', dados }));
  const consulta = mostrarPedidos ? pedidos : campanhas;
  function limparFiltros() { definirBusca(''); definirRegiao('Todas as regiões'); definirCategoria('Todas'); definirTipo('Todos'); definirUrgencia('Todas'); definirVerificadas('Todas'); definirOrdem('Recentes'); definirValorMaximo(''); }
  return <ContentMotion style={s.screen}><FlatList<ItemExplorar> keyboardShouldPersistTaps="handled" data={itens} keyExtractor={item => item.tipo + ':' + item.dados.id} contentContainerStyle={[s.content, { paddingTop: Math.max(24, insets.top + 12), paddingBottom: Math.max(32, insets.bottom + 20) }]} ItemSeparatorComponent={() => <View style={{ height: 16 }}/>}
    ListHeaderComponent={<View style={{ gap: 16, marginBottom: 20 }}><Text style={s.demoText}>AMBIENTE ACADÊMICO · DADOS LOCAIS</Text><Logo/><Text accessibilityRole="header" style={[s.heading, { marginBottom: 0 }]}>Explorar</Text><Copy muted>Uma causa, muitas formas de fazer parte.</Copy>
      <Button secondary title="Encontrar no Mapa Solidário" onPress={() => roteador.push('/mapa')}/>
      <Field label="Buscar campanhas ou necessidades" value={busca} onChangeText={definirBusca} placeholder="Uma causa, um objeto, uma ação..."/>
      <Choices options={['Campanhas', 'Necessidades', 'Voluntariado', 'Eventos']} selected={secao} onSelect={definirSecao}/>
      <Disclosure title="Filtrar campanhas e necessidades"><Button secondary title={'Região: ' + regiao} onPress={() => { definirRegiaoEscolhida(regiao); definirCategoriaEscolhida(categoria); definirJanela(true); }}/>
      {!mostrarPedidos ? <><Choices label="Urgência revisada" options={['Todas', 'Crítica', 'Moderada', 'Regular']} selected={urgencia} onSelect={definirUrgencia}/><Choices label="Verificação" options={['Todas', 'Verificadas']} selected={verificadas} onSelect={definirVerificadas}/><Choices label="Ordenar campanhas" options={['Equilibradas', 'Recentes', 'Prazo próximo', 'Perto da meta']} selected={ordem} onSelect={definirOrdem}/><Field label="Meta financeira máxima em R$ (opcional)" numeric value={valorMaximo} onChangeText={definirValorMaximo}/></> : null}
      </Disclosure>{secao === 'Necessidades' ? <Choices options={['Todos', 'Objetos', 'Tempo', 'R$']} selected={tipo} onSelect={definirTipo}/> : null}
      {secao === 'Voluntariado' ? <Copy muted>Encontre tarefas e reserve uma vaga para participar.</Copy> : secao === 'Eventos' ? <Copy muted>Encontros gratuitos organizados pelas campanhas. Abra um evento para consultar data, horário e local.</Copy> : null}
      {!mostrarPedidos && categoria !== 'Todas' ? <Copy muted>{'Categoria: ' + categoria}</Copy> : null}
      <EstadoConexao {...consulta}/>{!consulta.carregando && !consulta.erro ? <Copy muted>{itens.length + (itens.length === 1 ? ' oportunidade' : ' oportunidades')}</Copy> : null}
    </View>}
    renderItem={({ item }) => item.tipo === 'pedido' ? <CartaoNecessidade pedido={item.dados} aoAbrir={() => roteador.push({ pathname: item.dados.tipo === 'tarefa' ? '/voluntariado' : '/necessidade', params: { id: item.dados.id } })}/> : <CartaoCampanha campanha={item.dados} pedido={pedidos.dados?.find(pedido => pedido.campanha_id === item.dados.id && pedido.tipo !== 'dinheiro')} evento={secao === 'Eventos'} aoAbrir={() => roteador.push({ pathname: secao === 'Eventos' ? '/acao' : '/campanha', params: { id: item.dados.id } })}/>}
    ListEmptyComponent={!consulta.carregando && !consulta.erro ? <EmptyState title="Vamos procurar por outro caminho?" action="Limpar filtros" onPress={limparFiltros}>Não encontramos oportunidades com essa busca. Tente outra palavra ou região.</EmptyState> : null}
  /><Dialog visible={janela} title="Encontre uma causa perto de você" onClose={() => definirJanela(false)}><Heading>Região</Heading><Choices options={regioes} selected={regiaoEscolhida} onSelect={definirRegiaoEscolhida}/>{!mostrarPedidos ? <><Heading>Categoria</Heading><Choices options={categorias} selected={categoriaEscolhida} onSelect={definirCategoriaEscolhida}/></> : null}<Button secondary title="Busca e filtros avançados" onPress={()=>{definirJanela(false);roteador.push('/descoberta');}}/><Button title="Aplicar filtros" onPress={() => { definirRegiao(regiaoEscolhida); definirCategoria(categoriaEscolhida); definirJanela(false); }}/></Dialog></ContentMotion>;
}

export function Campaign() {
  const roteador = useRouter(); const { s, colors } = useTheme(); const { id } = useLocalSearchParams<{ id?: string }>();
  const identificador = id || 'familia';
  const consulta = useDados<Campanha>('/campanhas/' + identificador); const campanha = consulta.dados;
  const financeiro = useDados<Inteligencia>(`/campanhas/${identificador}/inteligencia`); const resumo = financeiro.dados;
  const [ajudando, definirAjudando] = useState(false);
  useEffect(()=>{void requisitar('/campanhas/'+identificador+'/visualizacao','POST').catch(()=>{});},[identificador]);
  const pedidos = campanha?.necessidades.filter(p => p.tipo === 'dinheiro' && p.tipo_meta === 'aberta' || p.meta > p.recebido + Number(p.reservado)) || [];
  const propria = campanha?.usuario_id === usuarioLogado()?.id;
  function ajudar() {
    if (pedidos.length !== 1) { definirAjudando(true); return; }
    const pedido = pedidos[0];
    roteador.push({ pathname: pedido.tipo === 'dinheiro' ? '/doacao' : pedido.tipo === 'tarefa' ? '/voluntariado' : '/contribuir', params: { id: pedido.id } });
  }
  function compartilhar() { void Share.share({ message: `${campanha?.titulo || 'Conheça esta campanha no Soma'} ${typeof window !== 'undefined' ? window.location.origin : 'soma:/'} /campanha?id=${encodeURIComponent(identificador)}`.replace(' /campanha', '/campanha') }).catch(() => {}); }
  return <Screen variant="detail" title="Campanha"><EstadoConexao {...consulta}/>{campanha ? <>
    <Heading>{campanha.titulo}</Heading><Copy muted>{campanha.categoria}{campanha.regiao ? ` · ${campanha.regiao}` : ''}</Copy>
    {resumo?.urgencia.verificada ? <Tag>{`${resumo.urgencia.categoria} · urgência verificada`}</Tag> : null}
    <View style={{ overflow: 'hidden', borderRadius: radius.hero, backgroundColor: colors.surface }}>{resumo?.imagem ? <Image source={{ uri: resumo.imagem }} style={{ height: 180 }} contentFit="cover" accessibilityLabel="Foto da campanha enviada pelo responsável"/> : <FotoDeCampanha campanhaId={campanha.id} categoria={campanha.categoria} height={180}/>}</View>
    <Copy>{campanha.descricao.length > 190 ? campanha.descricao.slice(0, 190).trim() + '…' : campanha.descricao}</Copy>
    <EstadoConexao {...financeiro}/>{resumo && resumo.meta > 0 ? <View style={{ gap: 10 }}><Text style={s.sectionTitle}>{formatarDinheiro(resumo.arrecadado / 100)} arrecadados no teste</Text><Copy muted>Meta de {formatarDinheiro(resumo.meta / 100)}</Copy><Progress done={resumo.arrecadado} total={resumo.meta}/></View> : null}
    {propria ? <Button title="Cuidar da minha campanha" onPress={() => roteador.push({ pathname: '/gerenciar', params: { id: campanha.id } })}/> : campanha.estado === 'ativa' && pedidos.length ? <Button title="Ajudar esta campanha" onPress={ajudar}/> : <Notice>Esta campanha não recebe novas ajudas agora. Seu histórico continua disponível.</Notice>}
    {resumo && resumo.meta > 0 ? <Copy muted>Valores de demonstração. Ainda não há pagamento real integrado.</Copy> : null}
    <Button secondary title="Compartilhar campanha" onPress={compartilhar}/>{campanha.perfil_publico?<Button secondary title="Conhecer quem organiza" onPress={()=>roteador.push({pathname:'/perfil-publico',params:{id:String(campanha.usuario_id)}})}/>:null}
    <Disclosure title="Escolher uma forma de ajudar" initiallyOpen={ajudando} key={ajudando ? 'aberto' : 'fechado'}>{campanha.necessidades.map(p => <CartaoNecessidade key={p.id} pedido={p} aoAbrir={() => roteador.push({ pathname: '/necessidade', params: { id: p.id } })}/>)}</Disclosure>
    <RotaConvite id={campanha.id} estado={campanha.estado} dados={resumo} criador={propria}/>
    <Disclosure title="História completa e responsável"><Copy>{campanha.descricao}</Copy><Copy muted>Organizada por {campanha.responsavel}{campanha.prazo ? ` · data desejada: ${campanha.prazo}` : ' · sem prazo definido'}</Copy>{campanha.instrucoes ? <Copy>{campanha.instrucoes}</Copy> : null}</Disclosure>
    <Disclosure title="Atualizações e transparência">{campanha.evento ? <Card title="Um encontro para somar" subtitle={campanha.evento} icon="calendar-outline" onPress={() => roteador.push({ pathname: '/acao', params: { id: campanha.id } })}/> : null}<Button secondary title="Atualizações da campanha" onPress={() => roteador.push({ pathname: '/atualizacoes', params: { campanha: campanha.id } })}/><Button secondary title="Resultado e impacto" onPress={() => roteador.push({ pathname: '/resultado', params: { id: campanha.id } })}/></Disclosure>
    <Button secondary title="Denunciar campanha" onPress={() => roteador.push({ pathname: '/denunciar', params: { id: campanha.id } })}/>
  </> : null}</Screen>;
}

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
