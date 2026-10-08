import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, Field, Heading, Notice, Screen, Tag, colors, s } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { requisitar, useDados, usuarioLogado, mensagemErro, type Necessidade, type Campanha, type Ajuda, type Atividade } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';

export function ObjectContribution() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'cobertores'}`); const pedido = consulta.dados;
  const [quantidade, definirQuantidade] = useState('1'); const [entrega, definirEntrega] = useState('Ponto de coleta'); const [horario, definirHorario] = useState(''); const [observacao, definirObservacao] = useState(''); const [erro, definirErro] = useState('');
  const livre = pedido ? pedido.meta - pedido.recebido - Number(pedido.reservado) : 0;
  return <Screen title="Contribuir com objeto" heading="Sua ajuda faz diferença." subtitle={pedido?.nome}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{pedido ? <>
      <Field label="Quantidade *" numeric value={quantidade} onChangeText={definirQuantidade}/><Copy muted>{livre} unidades livres</Copy>
      <Heading>Como pretende entregar?</Heading><Choices options={['Ponto de coleta', 'Combinar entrega']} selected={entrega} onSelect={definirEntrega}/><Notice>{pedido.instrucoes}</Notice>
      <Field label="Horário pretendido *" value={horario} onChangeText={definirHorario}/><Field label="Observação (opcional)" multiline value={observacao} onChangeText={definirObservacao}/>
      {erro ? <Notice error>{erro}</Notice> : null}<Button title="Revisar minha ajuda" onPress={() => { const valor = Number(quantidade); if (!Number.isInteger(valor) || valor < 1 || valor > livre || !horario.trim()) { definirErro(`Escolha de 1 a ${livre} unidades e informe o horário.`); return; } roteador.push({ pathname: '/revisar-ajuda', params: { id: pedido.id, modo: 'objeto', quantidade, entrega, horario, observacao } }); }}/>
    </> : null}</>}
  </Screen>;
}

export function Volunteer() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'organizar'}`);
  const [observacao, definirObservacao] = useState('');
  return <Screen title="Voluntariado" heading={consulta.dados?.nome || 'Voluntariado'}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{consulta.dados ? <><Copy>{consulta.dados.descricao}</Copy><Notice>{consulta.dados.instrucoes}</Notice><Copy muted>{consulta.dados.meta - consulta.dados.recebido - Number(consulta.dados.reservado)} vagas livres</Copy><Field label="Observação (opcional)" multiline value={observacao} onChangeText={definirObservacao}/><Button title="Revisar minha participação" onPress={() => roteador.push({ pathname: '/revisar-ajuda', params: { id: consulta.dados!.id, modo: 'tarefa', observacao, quantidade: '1' } })}/></> : null}</>}
  </Screen>;
}

export function Action() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'familia'}`); const campanha = consulta.dados;
  return <Screen title="Ação da campanha" heading="Uma ação para somar." subtitle={campanha?.titulo}><EstadoConexao {...consulta}/>{campanha ? <>
    {campanha.evento ? <><Card title={campanha.evento} subtitle={campanha.regiao} icon="calendar-outline"/><Copy>{campanha.instrucoes}</Copy><Copy muted>Participação gratuita.</Copy><Button title="Participar da ação" onPress={() => roteador.push({ pathname: '/revisar-ajuda', params: { campanha_id: campanha.id, modo: 'acao', quantidade: '1' } })}/></> : <Notice>Esta campanha não tem ação cadastrada.</Notice>}
  </> : null}</Screen>;
}

export function ReviewHelp() {
  const roteador = useRouter(); const parametros = useLocalSearchParams<{ id?: string; campanha_id?: string; modo?: string; quantidade?: string; entrega?: string; horario?: string; observacao?: string }>();
  const [aceito, definirAceito] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function registrar() {
    definirOcupado(true); definirErro('');
    try { const ajuda = await requisitar<{ id: number }>('/ajudas', 'POST', { necessidade_id: parametros.id, campanha_id: parametros.campanha_id, tipo: parametros.modo || 'objeto', quantidade: Number(parametros.quantidade || 1), entrega: parametros.entrega || '', horario: parametros.horario || '', observacao: parametros.observacao || '' }); roteador.replace({ pathname: '/ajuda', params: { id: String(ajuda.id) } }); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Revisar compromisso" heading="Confira a sua ajuda.">
    {!usuarioLogado() ? <PedirLogin/> : <><Card title={parametros.modo === 'acao' ? 'Participação na ação' : `${parametros.quantidade || 1} unidade(s) · ${parametros.modo || 'objeto'}`} subtitle={parametros.entrega || parametros.horario}><Copy>{parametros.observacao}</Copy></Card>
      <Button secondary title="Editar minha ajuda" onPress={() => roteador.back()}/><View style={s.row}><Switch accessibilityLabel="Li as instruções da ajuda" value={aceito} onValueChange={definirAceito} trackColor={{ false: colors.line, true: colors.primary }}/><View style={{ flex: 1 }}><Copy>Li as instruções da ajuda</Copy></View></View>
      <Notice>Registrar reserva os itens ou vagas. O responsável confirma a realização depois.</Notice>{erro ? <Notice error>{erro}</Notice> : null}<Button title={ocupado ? 'Registrando...' : 'Registrar ajuda'} disabled={!aceito || ocupado} onPress={registrar}/>
    </>}
  </Screen>;
}

export function Activity() {
  const roteador = useRouter(); const consulta = useDados<Atividade>(usuarioLogado() ? '/atividade' : null); const [secao, definirSecao] = useState('Ajudas');
  const ajudas = (consulta.dados?.ajudas || []).filter(ajuda => secao === 'Ações' ? ajuda.tipo === 'acao' : ajuda.tipo !== 'acao');
  return <Screen title="Minha atividade" heading="Acompanhe sua ajuda." back={false}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/><Choices options={['Ajudas', 'Campanhas', 'Ações']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Campanhas' ? <>{consulta.dados?.campanhas.map(campanha => <Card key={campanha.id} title={campanha.titulo} subtitle={campanha.estado} icon="book-outline" onPress={() => roteador.push({ pathname: '/gerenciar', params: { id: campanha.id } })}/>)}{consulta.dados?.campanhas.length === 0 ? <Notice>Você ainda não criou uma campanha.</Notice> : null}</> : <>
        {ajudas.map(ajuda => <Card key={ajuda.id} title={`${ajuda.quantidade} · ${ajuda.necessidade}`} subtitle={`${ajuda.campanha} · ${ajuda.estado}`} onPress={() => roteador.push({ pathname: '/ajuda', params: { id: String(ajuda.id) } })}/>)}
        {secao === 'Ajudas' ? consulta.dados?.pagamentos.map(pagamento => <Card key={`pagamento-${pagamento.id}`} title={`${formatarDinheiro(pagamento.valor / 100)} · doação de teste`} subtitle={`${pagamento.campanha} · ${pagamento.estado}`} icon="wallet-outline" onPress={() => roteador.push({ pathname: '/pagamento', params: { id: String(pagamento.id) } })}/>) : null}
        {!ajudas.length && (secao !== 'Ajudas' || !consulta.dados?.pagamentos.length) && !consulta.carregando ? <Notice>Nenhuma atividade nesta categoria.</Notice> : null}
      </>}
    </>}
  </Screen>;
}

export function HelpDetails() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Ajuda>(id && usuarioLogado() ? `/ajudas/${id}` : null);
  const [janela, definirJanela] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false); const ajuda = consulta.dados;
  async function cancelar() {
    definirOcupado(true);
    try { await requisitar(`/ajudas/${id}/cancelar`, 'PATCH'); definirJanela(false); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Minha ajuda" heading={ajuda ? `${ajuda.quantidade} · ${ajuda.necessidade}` : 'Minha ajuda'} subtitle={ajuda?.campanha}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{ajuda ? <>
      <Tag>{ajuda.estado.toLocaleUpperCase()}</Tag><Copy>Recebido: {ajuda.recebido} de {ajuda.quantidade}</Copy><Heading>Instruções</Heading><Copy>{ajuda.instrucoes}{'\n'}{ajuda.entrega}{'\n'}{ajuda.horario}</Copy>
      {ajuda.necessidade_id ? <Button secondary title="Ver necessidade" onPress={() => roteador.push({ pathname: '/necessidade', params: { id: ajuda.necessidade_id } })}/> : null}
      {['reservado', 'em_andamento'].includes(ajuda.estado) ? <Button danger title="Cancelar compromisso" onPress={() => definirJanela(true)}/> : null}
    </> : !id ? <Notice>Abra uma ajuda pela sua atividade.</Notice> : null}<Button secondary title="Minha atividade" onPress={() => roteador.replace('/atividade')}/></>}
    <Dialog visible={janela} title="Cancelar esta ajuda?" onClose={() => definirJanela(false)}><Copy>As unidades ou vagas ainda pendentes ficarão livres novamente. O que já foi recebido permanece registrado.</Copy>{erro ? <Notice error>{erro}</Notice> : null}<Button danger title="Confirmar cancelamento" disabled={ocupado} onPress={cancelar}/><Button secondary title="Manter compromisso" onPress={() => definirJanela(false)}/></Dialog>
  </Screen>;
}
