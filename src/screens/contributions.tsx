import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Switch, View } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, EmptyState, Field, Heading, Line, Notice, Screen, Tag, useTheme } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { requisitar, useDados, usuarioLogado, mensagemErro, criarChaveOperacao, type Necessidade, type Campanha, type Ajuda, type Atividade } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
import { FotoDeVoluntariado } from '../components/fotos';
import { CartaoCampanha } from '../components/campanhas';
import { lerEvento } from '../data/eventos';

export function ObjectContribution() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'cobertores'}`); const pedido = consulta.dados;
  const [quantidade, definirQuantidade] = useState('1'); const [observacao, definirObservacao] = useState(''); const [erro, definirErro] = useState('');
  const livre = pedido ? pedido.meta - pedido.recebido - Number(pedido.reservado) : 0;
  return <Screen variant="form" title="Contribuir com objeto" heading="Sua ajuda faz diferença." subtitle={pedido?.nome}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{pedido ? <>
      <Field label="Quantidade *" numeric value={quantidade} onChangeText={definirQuantidade}/><Copy muted>{livre} unidades livres</Copy>
      <Notice>Registre sua intenção de doar. Depois, combine a entrega diretamente com o responsável por telefone ou WhatsApp. Só o recebimento confirmado conta para a meta.</Notice>
      <Field label="Observação (opcional)" multiline value={observacao} onChangeText={definirObservacao}/>
      {erro ? <Notice error>{erro}</Notice> : null}<Button title="Revisar minha ajuda" disabled={livre <= 0 || pedido.campanha_estado !== 'ativa' || pedido.responsavel_id === usuarioLogado()?.id} onPress={() => { const valor = Number(quantidade); if (!Number.isInteger(valor) || valor < 1 || valor > livre) { definirErro(`Escolha de 1 a ${livre} unidades.`); return; } roteador.push({ pathname: '/revisar-ajuda', params: { id: pedido.id, modo: 'objeto', quantidade, entrega: 'Combinar diretamente com o responsável', observacao } }); }}/>
    </> : null}</>}
  </Screen>;
}

export function Volunteer() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'organizar'}`);
  const [observacao, definirObservacao] = useState('');
  const pedido = consulta.dados; const livre = pedido ? Math.max(0, pedido.meta - pedido.recebido - Number(pedido.reservado)) : 0;
  const propria = !!usuarioLogado() && pedido?.responsavel_id === usuarioLogado()?.id;
  return <Screen variant="detail" title="Voluntariado" heading={pedido?.nome || 'Seu tempo faz diferença.'} subtitle={pedido?.campanha}>
    <EstadoConexao {...consulta}/>{pedido ? <><FotoDeVoluntariado/><Heading>O que vamos fazer juntos</Heading><Copy>{pedido.descricao}</Copy><Heading>Onde e até quando</Heading><Copy>{pedido.instrucoes + '\n' + pedido.regiao + '\nPrazo: ' + pedido.prazo}</Copy><Copy muted>{livre} vagas livres</Copy>
      {propria ? <Notice>Você organiza esta campanha. Acompanhe as participações na gestão da causa.</Notice> : null}
      {!usuarioLogado() ? <PedirLogin/> : <><Field label="Observação (opcional)" multiline value={observacao} onChangeText={definirObservacao}/><Button title="Revisar minha participação" disabled={livre <= 0 || propria || pedido.campanha_estado !== 'ativa' || pedido.tipo !== 'tarefa'} onPress={() => roteador.push({ pathname: '/revisar-ajuda', params: { id: pedido.id, modo: 'tarefa', observacao, quantidade: '1' } })}/></>}
    </> : null}
  </Screen>;
}

export function Action() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'familia'}`); const campanha = consulta.dados;
  const propria = !!usuarioLogado() && campanha?.usuario_id === usuarioLogado()?.id;
  const detalhes = lerEvento(campanha?.evento || '');
  return <Screen variant="detail" title="Evento da comunidade" heading="Um encontro para somar." subtitle={campanha?.titulo}><EstadoConexao {...consulta}/>{campanha ? <>
    {campanha.evento ? <><FotoDeVoluntariado/><Heading>Data, horário e local</Heading>{detalhes ? <Card title={detalhes.nome} subtitle={campanha.regiao} icon="calendar-outline"><Line label="Data" value={detalhes.data}/><Line label="Horário" value={detalhes.horario}/><Line label="Local" value={detalhes.local}/></Card> : <Card title={campanha.evento} subtitle={campanha.regiao} icon="calendar-outline"/>}<Copy>{campanha.descricao}</Copy><Copy muted>{'Organização: ' + campanha.responsavel + '. Participação gratuita.'}</Copy>
      {propria ? <Notice>Você organiza este encontro. Consulte as participações na gestão da campanha.</Notice> : null}
      {campanha.estado !== 'ativa' ? <Notice>A campanha está encerrada ou indisponível para novas participações.</Notice> : null}
      {!usuarioLogado() ? <PedirLogin/> : <Button title="Participar da ação" disabled={propria || campanha.estado !== 'ativa'} onPress={() => roteador.push({ pathname: '/revisar-ajuda', params: { campanha_id: campanha.id, modo: 'acao', quantidade: '1' } })}/>}
    </> : <EmptyState title="Novos encontros podem acontecer.">Esta campanha ainda não tem um evento cadastrado.</EmptyState>}
  </> : null}</Screen>;
}

export function ReviewHelp() {
  const { s, colors } = useTheme();
  const roteador = useRouter(); const parametros = useLocalSearchParams<{ id?: string; campanha_id?: string; modo?: string; quantidade?: string; entrega?: string; horario?: string; observacao?: string }>();
  const [aceito, definirAceito] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const pedido = useDados<Necessidade>(parametros.id ? `/necessidades/${parametros.id}` : null);
  const campanha = useDados<Campanha>(parametros.modo === 'acao' && parametros.campanha_id ? `/campanhas/${parametros.campanha_id}` : null);
  const contexto = parametros.modo === 'acao' ? campanha : pedido;
  const envio = useRef(criarChaveOperacao());
  async function registrar() {
    definirOcupado(true); definirErro('');
    try { const ajuda = await requisitar<{ id: number }>('/ajudas', 'POST', { necessidade_id: parametros.id, campanha_id: parametros.campanha_id || pedido.dados?.campanha_id, tipo: parametros.modo || 'objeto', quantidade: Number(parametros.quantidade || 1), entrega: parametros.entrega || '', horario: parametros.horario || '', observacao: parametros.observacao || '' }, envio.current); roteador.replace({ pathname: '/ajuda', params: { id: String(ajuda.id), novo: '1' } }); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Revisar compromisso" heading="Confira a sua ajuda.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...contexto}/><Card title={campanha.dados?.evento || pedido.dados?.nome || 'Selecione uma oportunidade'} subtitle={campanha.dados?.titulo || pedido.dados?.campanha}><Copy>{parametros.modo === 'acao' ? 'Participação gratuita no encontro.' : `${parametros.quantidade || 1} ${parametros.modo === 'tarefa' ? 'vaga de voluntariado' : 'unidade(s) para doar'}`}</Copy>{pedido.dados ? <Copy>{pedido.dados.descricao}</Copy> : null}{parametros.entrega || parametros.horario ? <Copy>{[parametros.entrega, parametros.horario].filter(Boolean).join(' · ')}</Copy> : null}{parametros.observacao ? <Copy>{parametros.observacao}</Copy> : null}</Card>
      <Button secondary title="Editar minha ajuda" onPress={() => roteador.canGoBack() ? roteador.back() : roteador.replace('/explorar')}/><View style={s.row}><Switch accessibilityLabel="Li as instruções da ajuda" value={aceito} onValueChange={definirAceito} trackColor={{ false: colors.line, true: colors.primary }}/><View style={{ flex: 1 }}><Copy>Li as instruções da ajuda</Copy></View></View>
      <Notice>Registrar reserva os itens ou vagas. O responsável confirma a realização depois.</Notice>{erro ? <Notice error>{erro}</Notice> : null}<Button title={ocupado ? 'Registrando...' : 'Registrar ajuda'} disabled={!aceito || ocupado || contexto.carregando || !contexto.dados} onPress={registrar}/>
    </>}
  </Screen>;
}

export function Activity() {
  const roteador = useRouter(); const consulta = useDados<Atividade>(usuarioLogado() ? '/atividade' : null); const [secao, definirSecao] = useState('Ajudas');
  const ajudas = (consulta.dados?.ajudas || []).filter(ajuda => secao === 'Eventos' ? ajuda.tipo === 'acao' : secao === 'Voluntariado' ? ajuda.tipo === 'tarefa' : ajuda.tipo !== 'acao');
  return <Screen title="Minha atividade" heading="Acompanhe sua ajuda." back={false}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/><Choices options={['Ajudas', 'Voluntariado', 'Campanhas', 'Eventos']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Campanhas' ? <>{consulta.dados?.campanhas.map(campanha => <CartaoCampanha key={campanha.id} campanha={campanha} cta="Organizar campanha" aoAbrir={() => roteador.push({ pathname: '/gerenciar', params: { id: campanha.id } })}/>)}{consulta.dados?.campanhas.length === 0 ? <EmptyState title="Uma causa pode começar com você." action="Criar campanha" onPress={() => roteador.push('/criar')}>Você ainda não criou uma campanha.</EmptyState> : null}</> : <>
        {ajudas.map(ajuda => <Card key={ajuda.id} title={`${ajuda.quantidade} · ${ajuda.necessidade}`} subtitle={`${ajuda.campanha} · ${ajuda.estado}`} onPress={() => roteador.push({ pathname: '/ajuda', params: { id: String(ajuda.id) } })}/>)}
        {secao === 'Ajudas' ? consulta.dados?.pagamentos.map(pagamento => <Card key={`pagamento-${pagamento.id}`} title={`${formatarDinheiro(pagamento.valor / 100)} · doação de teste`} subtitle={`${pagamento.campanha} · ${pagamento.estado}`} icon="wallet-outline" onPress={() => roteador.push({ pathname: '/pagamento', params: { id: String(pagamento.id) } })}/>) : null}
        {!ajudas.length && (secao !== 'Ajudas' || !consulta.dados?.pagamentos.length) && !consulta.carregando && !consulta.erro ? <EmptyState title="Seu próximo gesto pode começar aqui." action="Explorar oportunidades" onPress={() => roteador.push({ pathname: '/explorar', params: { secao: secao === 'Eventos' ? 'Eventos' : secao === 'Voluntariado' ? 'Voluntariado' : 'Necessidades', entrada: String(Date.now()) } })}>Suas participações aparecem aqui depois de registradas.</EmptyState> : null}
      </>}
    </>}
  </Screen>;
}

export function HelpDetails() {
  const roteador = useRouter(); const { id, novo } = useLocalSearchParams<{ id?: string; novo?: string }>(); const consulta = useDados<Ajuda>(id && usuarioLogado() ? `/ajudas/${id}` : null);
  const [janela, definirJanela] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false); const ajuda = consulta.dados;
  const evento = useDados<Campanha>(ajuda?.tipo === 'acao' ? `/campanhas/${ajuda.campanha_id}` : null);
  const pedido = useDados<Necessidade>(ajuda?.necessidade_id ? `/necessidades/${ajuda.necessidade_id}` : null);
  const digitos = ajuda?.telefone_responsavel?.replace(/\D/g, '') || '';
  const telefone = /^\d{10,11}$/.test(digitos) ? '55' + digitos : /^55\d{10,11}$/.test(digitos) ? digitos : '';
  async function cancelar() {
    definirOcupado(true);
    try { await requisitar(`/ajudas/${id}/cancelar`, 'PATCH'); definirJanela(false); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="detail" title="Minha ajuda" heading={ajuda ? `${ajuda.quantidade} · ${ajuda.necessidade}` : 'Minha ajuda'} subtitle={ajuda?.campanha}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{ajuda ? <>
      {novo === '1' && ajuda.estado !== 'cancelado' ? <Notice success>Seu compromisso foi registrado. Confira as instruções e acompanhe o status por aqui.</Notice> : null}
      <Tag>{ajuda.estado.toLocaleUpperCase()}</Tag><Copy>Realizado: {ajuda.recebido} de {ajuda.quantidade}</Copy><Heading>{ajuda.tipo === 'acao' ? 'Detalhes do encontro' : 'Instruções da participação'}</Heading><EstadoConexao {...(ajuda.tipo === 'acao' ? evento : pedido)}/><Copy>{ajuda.tipo === 'acao' ? evento.dados?.evento : pedido.dados?.descricao}{'\n'}{ajuda.tipo === 'acao' ? evento.dados?.regiao : ajuda.instrucoes}{'\n'}{ajuda.entrega}{'\n'}{ajuda.horario}</Copy>
      {ajuda.necessidade_id ? <Button secondary title="Ver necessidade" onPress={() => roteador.push({ pathname: '/necessidade', params: { id: ajuda.necessidade_id } })}/> : null}
      {telefone ? <><Button secondary title="Combinar por WhatsApp" onPress={() => { void Linking.openURL('https://wa.me/' + telefone).catch(() => definirErro('Não foi possível abrir o WhatsApp. Tente ligar para o responsável.')); }}/><Button secondary title="Ligar para o responsável" onPress={() => { void Linking.openURL('tel:+' + telefone).catch(() => definirErro('Não foi possível abrir o telefone neste dispositivo.')); }}/></> : ajuda.tipo === 'objeto' ? <Copy muted>O responsável ainda não informou telefone no perfil. Consulte as orientações da ajuda para combinar a entrega.</Copy> : null}
      {erro && !janela ? <Notice error>{erro}</Notice> : null}
      {['reservado', 'em_andamento'].includes(ajuda.estado) ? <Button danger title="Cancelar compromisso" onPress={() => definirJanela(true)}/> : null}
    </> : !id ? <Notice>Abra uma ajuda pela sua atividade.</Notice> : null}<Button secondary title="Minha atividade" onPress={() => roteador.replace('/atividade')}/></>}
    <Dialog visible={janela} title="Cancelar esta ajuda?" onClose={() => definirJanela(false)}><Copy>As unidades ou vagas ainda pendentes ficarão livres novamente. O que já foi recebido permanece registrado.</Copy>{erro ? <Notice error>{erro}</Notice> : null}<Button danger title="Confirmar cancelamento" disabled={ocupado} onPress={cancelar}/><Button secondary title="Manter compromisso" onPress={() => definirJanela(false)}/></Dialog>
  </Screen>;
}
