import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Dialog, Field, Heading, Notice, Screen, Tag } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { useDados, requisitar, usuarioLogado, mensagemErro, type Campanha, type Ajuda } from '../servicos/api';
import { parametrosDaCampanha } from './creation';

export function Manage() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'biblioteca'}`); const campanha = consulta.dados; const pessoa = usuarioLogado();
  const [janela, definirJanela] = useState(false); const [motivo, definirMotivo] = useState(''); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const permitido = pessoa && campanha && (campanha.usuario_id === pessoa.id || pessoa.administrador);
  async function encerrar() {
    definirOcupado(true);
    try { if (!motivo.trim()) throw new Error('Informe o motivo.'); await requisitar(`/campanhas/${campanha!.id}/encerrar`, 'PATCH', { motivo }); definirJanela(false); consulta.atualizar(); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Gerenciar campanha" heading={campanha?.titulo} subtitle="Painel do responsável"><EstadoConexao {...consulta}/>
    {!pessoa ? <PedirLogin/> : campanha && !permitido ? <Notice>Você não é responsável por esta campanha.</Notice> : campanha ? <>
      <Tag>{campanha.estado.toLocaleUpperCase()}</Tag>
      {campanha.necessidades.map(pedido => <Card key={pedido.id} title={pedido.nome} subtitle={`${pedido.recebido} recebidos · ${pedido.reservado} reservados`}/>)}
      <Card title="Confirmar ajudas" icon="checkmark-circle-outline" onPress={() => roteador.push({ pathname: '/confirmar', params: { campanha: campanha.id } })}/>
      <Card title="Publicar atualização" icon="document-text-outline" onPress={() => roteador.push({ pathname: '/publicar', params: { campanha: campanha.id } })}/>
      <Card title="Editar campanha" icon="create-outline" onPress={() => roteador.push({ pathname: '/criar', params: parametrosDaCampanha(campanha) })}/>
      <Card title="Saldo e repasses de teste" icon="wallet-outline" onPress={() => roteador.push({ pathname: '/saldo', params: { campanha: campanha.id } })}/>
      <Button secondary title="Resultado e impacto" onPress={() => roteador.push({ pathname: '/resultado', params: { id: campanha.id } })}/>
      <Button secondary title="Adicionar necessidade" onPress={() => roteador.push({ pathname: '/editar-necessidade', params: parametrosDaCampanha(campanha) })}/>
      {campanha.estado !== 'encerrada' ? <Button danger title="Encerrar campanha" onPress={() => definirJanela(true)}/> : <Notice>Campanha encerrada. O histórico permanece disponível.</Notice>}
    </> : null}
    <Dialog visible={janela} title="Encerrar esta campanha?" onClose={() => definirJanela(false)}><Copy>Encerrar impede novas ajudas. Não marca os pedidos como atendidos.</Copy><Field label="Motivo do encerramento *" multiline value={motivo} onChangeText={definirMotivo}/>{erro ? <Notice error>{erro}</Notice> : null}<Button danger title="Confirmar encerramento" disabled={ocupado} onPress={encerrar}/></Dialog>
  </Screen>;
}

export function ConfirmHelp() {
  const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const consulta = useDados<Ajuda[]>(usuarioLogado() ? `/campanhas/${campanha || 'biblioteca'}/ajudas` : null);
  const [selecionada, definirSelecionada] = useState<number | null>(null); const [quantidade, definirQuantidade] = useState(''); const [estado, definirEstado] = useState('Entregue'); const [restante, definirRestante] = useState('Manter pendente'); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const ajuda = consulta.dados?.find(item => item.id === selecionada);
  async function confirmar() {
    if (!ajuda) return;
    definirOcupado(true);
    try { await requisitar<Ajuda>(`/ajudas/${ajuda.id}/confirmar`, 'PATCH', { recebido: estado === 'Em andamento' ? ajuda.recebido : Number(quantidade), cancelar_restante: restante === 'Cancelar restante' }); definirMensagem('Realização salva.'); definirSelecionada(null); consulta.atualizar(); }
    catch (problema) { definirMensagem(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Confirmar ajuda" heading="Registre o recebimento.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>
      {consulta.dados?.filter(item => ['reservado', 'em_andamento'].includes(item.estado)).map(item => <Card key={item.id} title={`${item.quantidade} · ${item.necessidade}`} subtitle={`${item.pessoa} · já recebido: ${item.recebido}`} onPress={() => { definirSelecionada(item.id); definirQuantidade(String(item.quantidade)); definirMensagem(''); }}/>)}
      {ajuda ? <><Field label="Total recebido até agora *" numeric value={quantidade} onChangeText={definirQuantidade}/><Choices options={['Em andamento', 'Entregue']} selected={estado} onSelect={definirEstado}/><Heading>Se houver quantidade restante</Heading><Choices options={['Manter pendente', 'Cancelar restante']} selected={restante} onSelect={definirRestante}/><Button title="Confirmar recebimento" disabled={ocupado} onPress={confirmar}/></> : <Copy muted>Selecione uma ajuda pendente. Só o responsável confirma a ajuda de outra pessoa.</Copy>}
      {mensagem ? <Notice>{mensagem}</Notice> : null}
    </>}
  </Screen>;
}

export function PublishUpdate() {
  const roteador = useRouter(); const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const [titulo, definirTitulo] = useState(''); const [relato, definirRelato] = useState(''); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function publicar() {
    definirOcupado(true);
    try { await requisitar(`/campanhas/${campanha || 'biblioteca'}/atualizacoes`, 'POST', { titulo, relato }); roteador.replace({ pathname: '/atualizacoes', params: { campanha: campanha || 'biblioteca' } }); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Publicar atualização" heading="O que mudou na causa?">{!usuarioLogado() ? <PedirLogin/> : <><Field label="Título da atualização *" value={titulo} onChangeText={definirTitulo}/><Field label="Relato *" multiline value={relato} onChangeText={definirRelato}/>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Publicar atualização" disabled={ocupado} onPress={publicar}/></>}</Screen>;
}

export function Report() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(`/campanhas/${id || 'familia'}`);
  const [janela, definirJanela] = useState(true); const [motivo, definirMotivo] = useState('Informações incoerentes'); const [relato, definirRelato] = useState(''); const [enviado, definirEnviado] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function denunciar() {
    definirOcupado(true);
    try { await requisitar('/denuncias', 'POST', { campanha_id: id || 'familia', motivo, relato }); definirEnviado(true); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Campanha" heading={consulta.dados?.titulo}><EstadoConexao {...consulta}/>{!usuarioLogado() ? <PedirLogin/> : <Button secondary title="Abrir formulário de denúncia" onPress={() => definirJanela(true)}/>}
    <Dialog visible={janela && !!usuarioLogado()} title="Denunciar" onClose={() => definirJanela(false)}>
      {enviado ? <><Notice>Denúncia salva para análise. A campanha não é suspensa automaticamente.</Notice><Button title="Fechar" onPress={() => definirJanela(false)}/></> : <>
        <Choices options={['Informações incoerentes', 'Uso inadequado', 'Outro motivo']} selected={motivo} onSelect={definirMotivo}/><Field label="Descreva o problema *" multiline value={relato} onChangeText={definirRelato}/>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Registrar denúncia" disabled={ocupado} onPress={denunciar}/><Button secondary title="Cancelar" onPress={() => definirJanela(false)}/>
      </>}
    </Dialog>
  </Screen>;
}
