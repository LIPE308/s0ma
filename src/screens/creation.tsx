import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { Button, Card, Choices, Copy, Field, Heading, Notice, Screen, colors, s } from '../components/ui';
import { PedirLogin } from '../components/conexao';
import { categorias, converterValor, formatarDinheiro } from '../data/formatacao';
import { requisitar, usuarioLogado, mensagemErro, type Campanha } from '../servicos/api';

export type PedidoRascunho = { id: string; nome: string; tipo: string; meta: string; tipo_meta: string; prioridade: string; prazo: string; descricao: string };
export type ParametrosRascunho = { campanha_id?: string; titulo?: string; descricao?: string; categoria?: string; pedidos?: string; regiao?: string; prazo?: string; instrucoes?: string; evento?: string; editar?: string };
export function lerPedidos(valor?: string): PedidoRascunho[] {
  if (!valor) return [];
  try { const lista = JSON.parse(valor); return Array.isArray(lista) ? lista.filter(pedido => pedido && typeof pedido.id === 'string' && typeof pedido.nome === 'string') : []; } catch { return []; }
}
export function parametrosDaCampanha(campanha: Campanha): ParametrosRascunho {
  return { campanha_id: campanha.id, titulo: campanha.titulo, descricao: campanha.descricao, categoria: campanha.categoria, regiao: campanha.regiao, prazo: campanha.prazo, instrucoes: campanha.instrucoes, evento: campanha.evento, pedidos: JSON.stringify(campanha.necessidades.map(pedido => ({ ...pedido, meta: String(pedido.tipo === 'dinheiro' ? pedido.meta / 100 : pedido.meta) }))) };
}

export function Story() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<ParametrosRascunho>();
  const [titulo, definirTitulo] = useState(parametros.titulo || ''); const [descricao, definirDescricao] = useState(parametros.descricao || ''); const [categoria, definirCategoria] = useState(parametros.categoria || 'Família'); const [erro, definirErro] = useState('');
  useEffect(() => { definirTitulo(parametros.titulo || ''); definirDescricao(parametros.descricao || ''); definirCategoria(parametros.categoria || 'Família'); }, [parametros.titulo, parametros.descricao, parametros.categoria]);
  return <Screen title={parametros.campanha_id ? 'Editar campanha' : 'Criar campanha'} step="PASSO 1 DE 4" heading="Qual situação precisa de ajuda?" back={false}>
    {!usuarioLogado() ? <PedirLogin/> : <>
      <Field label="Título da campanha *" value={titulo} onChangeText={definirTitulo}/><Field label="Descrição e beneficiários *" multiline value={descricao} onChangeText={definirDescricao}/>
      <Heading>Categoria solidária</Heading><Choices options={categorias} selected={categoria} onSelect={definirCategoria}/>
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button title="Continuar: necessidades" onPress={() => { if (!titulo.trim() || !descricao.trim()) { definirErro('Preencha o título e a descrição.'); return; } roteador.push({ pathname: '/pedidos', params: { ...parametros, titulo, descricao, categoria } }); }}/>
    </>}
  </Screen>;
}

export function Requests() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<ParametrosRascunho>(); const pedidos = lerPedidos(parametros.pedidos);
  return <Screen title="Criar campanha" step="PASSO 2 DE 4" heading="Do que precisa?" subtitle="Cada pedido vira uma necessidade.">
    {pedidos.map(pedido => <Card key={pedido.id} title={pedido.nome} subtitle={`${pedido.tipo} · meta ${pedido.tipo === 'dinheiro' ? formatarDinheiro(converterValor(pedido.meta)) : pedido.meta}`} onPress={() => roteador.push({ pathname: '/editar-necessidade', params: { ...parametros, editar: pedido.id } })}/>)}
    {!pedidos.length ? <Notice>Adicione pelo menos uma necessidade para continuar.</Notice> : null}
    <Button secondary title="Adicionar necessidade" onPress={() => roteador.push({ pathname: '/editar-necessidade', params: { ...parametros, editar: '' } })}/>
    <Button title="Continuar: organização" disabled={!pedidos.length} onPress={() => roteador.push({ pathname: '/organizacao', params: parametros })}/>
  </Screen>;
}

export function EditRequest() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<ParametrosRascunho>(); const pedidos = lerPedidos(parametros.pedidos); const original = pedidos.find(pedido => pedido.id === parametros.editar);
  const [nome, definirNome] = useState(original?.nome || ''); const [tipo, definirTipo] = useState(original?.tipo || 'objeto'); const [meta, definirMeta] = useState(original?.meta || '');
  const [tipoMeta, definirTipoMeta] = useState(original?.tipo_meta || 'fechada'); const [prioridade, definirPrioridade] = useState(original?.prioridade || 'Normal');
  const [prazo, definirPrazo] = useState(original?.prazo || ''); const [descricao, definirDescricao] = useState(original?.descricao || ''); const [erro, definirErro] = useState('');
  function salvar() {
    const valor = converterValor(meta);
    if (!nome.trim() || !Number.isFinite(valor) || valor <= 0 || (tipo !== 'dinheiro' && !Number.isInteger(valor))) { definirErro('Informe o nome e uma meta válida, maior que zero.'); return; }
    if (!prazo.trim() || !descricao.trim()) { definirErro('Informe prazo e instruções.'); return; }
    const pedido = { id: original?.id || `rascunho-${Date.now()}`, nome, tipo, meta, tipo_meta: tipoMeta, prioridade, prazo, descricao };
    const novaLista = original ? pedidos.map(anterior => anterior.id === original.id ? pedido : anterior) : [...pedidos, pedido];
    roteador.replace({ pathname: '/pedidos', params: { ...parametros, pedidos: JSON.stringify(novaLista), editar: '' } });
  }
  return <Screen title="Necessidade" heading="Um pedido bem definido.">
    <Field label="Nome *" value={nome} onChangeText={definirNome}/>
    <Choices options={['Dinheiro', 'Objeto', 'Tarefa']} selected={tipo === 'dinheiro' ? 'Dinheiro' : tipo === 'tarefa' ? 'Tarefa' : 'Objeto'} onSelect={valor => definirTipo(valor === 'Dinheiro' ? 'dinheiro' : valor === 'Tarefa' ? 'tarefa' : 'objeto')}/>
    <Field label={tipo === 'dinheiro' ? 'Meta líquida em reais *' : tipo === 'tarefa' ? 'Número de vagas *' : 'Quantidade de unidades *'} numeric value={meta} onChangeText={definirMeta}/>
    {tipo === 'dinheiro' ? <Choices options={['Fechada', 'Aberta']} selected={tipoMeta === 'fechada' ? 'Fechada' : 'Aberta'} onSelect={valor => definirTipoMeta(valor === 'Fechada' ? 'fechada' : 'aberta')}/> : null}
    <Choices options={['Normal', 'Alta']} selected={prioridade} onSelect={definirPrioridade}/>
    <Field label="Prazo *" value={prazo} onChangeText={definirPrazo} placeholder="30/10/2026"/><Field label="Instruções *" multiline value={descricao} onChangeText={definirDescricao}/>
    {erro ? <Notice error>{erro}</Notice> : null}<Button title="Salvar necessidade no rascunho" onPress={salvar}/>
  </Screen>;
}

export function Organization() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<ParametrosRascunho>(); const pedidos = lerPedidos(parametros.pedidos);
  const [regiao, definirRegiao] = useState(parametros.regiao || ''); const [prazo, definirPrazo] = useState(parametros.prazo || ''); const [instrucoes, definirInstrucoes] = useState(parametros.instrucoes || '');
  const [temEvento, definirTemEvento] = useState(!!parametros.evento); const [evento, definirEvento] = useState(parametros.evento || ''); const [erro, definirErro] = useState('');
  const temObjeto = pedidos.some(pedido => pedido.tipo === 'objeto');
  return <Screen title="Criar campanha" step="PASSO 3 DE 4" heading="Onde e até quando?">
    <Field label="Cidade e bairro *" value={regiao} onChangeText={definirRegiao}/><Field label="Prazo da campanha *" value={prazo} onChangeText={definirPrazo}/>
    <Card title={usuarioLogado()?.nome || 'Entre na sua conta'} subtitle="Responsável pela campanha" icon="person-outline"/>
    {temObjeto ? <Field label="Coleta e entrega *" multiline value={instrucoes} onChangeText={definirInstrucoes}/> : null}
    <View style={s.row}><Switch accessibilityLabel="Incluir ação opcional" value={temEvento} onValueChange={definirTemEvento} trackColor={{ false: colors.line, true: colors.primary }}/><Copy>Incluir uma ação gratuita</Copy></View>
    {temEvento ? <Field label="Nome, data, horário e local da ação *" multiline value={evento} onChangeText={definirEvento}/> : null}
    {erro ? <Notice error>{erro}</Notice> : null}<Button title="Continuar: revisão" onPress={() => { if (!regiao.trim() || !prazo.trim() || (temObjeto && !instrucoes.trim()) || (temEvento && !evento.trim())) { definirErro('Preencha os campos de organização.'); return; } roteador.push({ pathname: '/revisao', params: { ...parametros, regiao, prazo, instrucoes, evento: temEvento ? evento : '' } }); }}/>
  </Screen>;
}

export function CampaignReview() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<ParametrosRascunho>(); const pedidos = lerPedidos(parametros.pedidos);
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function salvarCampanha() {
    definirOcupado(true); definirErro('');
    try {
      const campanha = await requisitar<Campanha>(parametros.campanha_id ? `/campanhas/${parametros.campanha_id}` : '/campanhas', parametros.campanha_id ? 'PUT' : 'POST', { titulo: parametros.titulo, descricao: parametros.descricao, categoria: parametros.categoria, regiao: parametros.regiao, prazo: parametros.prazo, instrucoes: parametros.instrucoes || '', evento: parametros.evento || '', necessidades: pedidos.map(pedido => ({ ...pedido, id: pedido.id.startsWith('rascunho-') ? undefined : pedido.id, meta: pedido.tipo === 'dinheiro' ? Math.round(converterValor(pedido.meta) * 100) : Number(pedido.meta) })) });
      roteador.replace({ pathname: '/gerenciar', params: { id: campanha.id } });
    } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Revisão da campanha" step="PASSO 4 DE 4" heading="Uma causa bem explicada.">
    {parametros.titulo ? <><Card title={parametros.titulo} subtitle={`${parametros.categoria} · ${parametros.regiao}`}><Copy>{parametros.descricao}</Copy>{pedidos.map(pedido => <Copy key={pedido.id}>• {pedido.nome} · {pedido.tipo}</Copy>)}</Card>
      <Copy muted>Nesta versão básica, salvar publica a campanha. Não há análise automática de IA.</Copy>
      {erro ? <Notice error>{erro}</Notice> : null}<Button title={ocupado ? 'Salvando...' : 'Salvar campanha'} disabled={ocupado || !pedidos.length} onPress={salvarCampanha}/>
      <Button secondary title="Editar a história" onPress={() => roteador.push({ pathname: '/criar', params: parametros })}/></> : <><Notice>Comece preenchendo sua campanha.</Notice><Button title="Criar campanha" onPress={() => roteador.push('/criar')}/></>}
  </Screen>;
}
