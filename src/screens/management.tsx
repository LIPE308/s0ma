import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Dialog, EmptyState, Field, Heading, Notice, Screen } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { useDados, requisitar, usuarioLogado, mensagemErro, type Campanha, type Ajuda } from '../servicos/api';

export { Gerenciar as Manage } from './gerenciamento';

export function ConfirmHelp() {
  const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const consulta = useDados<Ajuda[]>(usuarioLogado() ? `/campanhas/${campanha || 'biblioteca'}/ajudas` : null);
  const [selecionada, definirSelecionada] = useState<number | null>(null); const [quantidade, definirQuantidade] = useState(''); const [restante, definirRestante] = useState('Manter pendente'); const [mensagem, definirMensagem] = useState(''); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const ajuda = consulta.dados?.find(item => item.id === selecionada);
  const pendentes = consulta.dados?.filter(item => ['reservado', 'em_andamento'].includes(item.estado));
  async function confirmar() {
    if (!ajuda) return;
    definirOcupado(true);
    try { const recebido = Number(quantidade); if (!Number.isInteger(recebido) || recebido < ajuda.recebido || recebido > ajuda.quantidade) throw new Error(`Informe o total já recebido, de ${ajuda.recebido} a ${ajuda.quantidade}.`); await requisitar<Ajuda>(`/ajudas/${ajuda.id}/confirmar`, 'PATCH', { recebido, cancelar_restante: restante === 'Cancelar restante' }); definirErro(''); definirMensagem('Recebimento confirmado. Somente a quantidade informada conta para a meta.'); definirSelecionada(null); consulta.atualizar(); }
    catch (problema) { definirErro(mensagemErro(problema)); definirMensagem(''); } finally { definirOcupado(false); }
  }
  return <Screen title="Confirmar ajuda" heading="Registre o recebimento.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>
      {pendentes?.map(item => <Card key={item.id} title={`${item.quantidade} · ${item.necessidade}`} subtitle={`${item.pessoa} · já recebido: ${item.recebido}`} onPress={() => { definirSelecionada(item.id); definirQuantidade(String(item.recebido)); definirRestante('Manter pendente'); definirMensagem(''); definirErro(''); }}/>)}
      {ajuda ? <><Field label="Total recebido até agora *" numeric value={quantidade} onChangeText={definirQuantidade}/><Copy muted>Informe o total acumulado, incluindo entregas anteriores. Uma entrega parcial mantém o restante pendente.</Copy><Heading>Se houver quantidade restante</Heading><Choices options={['Manter pendente', 'Cancelar restante']} selected={restante} onSelect={definirRestante}/><Button title={ocupado ? 'Salvando...' : 'Confirmar recebimento'} disabled={ocupado} onPress={confirmar}/></> : pendentes?.length === 0 ? <EmptyState title="Nenhuma ajuda pendente.">Quando alguém reservar itens ou vagas, a participação aparecerá aqui para você confirmar.</EmptyState> : pendentes?.length ? <Copy muted>Selecione uma ajuda pendente. Só o responsável confirma a ajuda de outra pessoa.</Copy> : null}
      {mensagem ? <Notice success>{mensagem}</Notice> : null}{erro ? <Notice error>{erro}</Notice> : null}
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
  return <Screen variant="form" title="Publicar atualização" heading="O que mudou na causa?">{!usuarioLogado() ? <PedirLogin/> : <><Field label="Título da atualização *" value={titulo} onChangeText={definirTitulo}/><Field label="Relato *" multiline value={relato} onChangeText={definirRelato}/>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Publicar atualização" disabled={ocupado} onPress={publicar}/></>}</Screen>;
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
