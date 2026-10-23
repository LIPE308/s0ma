import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Dialog, EmptyState, Field, Heading, Notice, Screen, Tag } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { useDados, requisitar, usuarioLogado, mensagemErro, type Administracao, type Campanha, type Repasse, type Pagamento } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';

export function Admin() {
  const roteador = useRouter(); const pessoa = usuarioLogado(); const consulta = useDados<Administracao>(pessoa?.administrador ? '/administracao' : null); const [secao, definirSecao] = useState('Campanhas'); const [erro, definirErro] = useState('');
  const [estadoRelatos, definirEstadoRelatos] = useState('Pendentes'); const [analisando, definirAnalisando] = useState<number | null>(null);
  const denuncias = consulta.dados?.denuncias.filter(d => d.estado === (estadoRelatos === 'Pendentes' ? 'pendente' : 'analisada'));
  async function analisarDenuncia(id: number) { definirAnalisando(id); definirErro(''); try { await requisitar(`/administracao/denuncias/${id}`, 'PATCH'); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirAnalisando(null); } }
  return <Screen variant="ledger" title="Administração" heading="Controle por exceção." subtitle="Campanhas, denúncias e operações do projeto em um só lugar.">
    {pessoa?.administrador ? <Button title="Urgência e fundo solidário" onPress={() => roteador.push('/solidariedade-admin')}/> : null}
    {!pessoa ? <PedirLogin/> : !pessoa.administrador ? <Notice>Esta área é exclusiva do administrador.</Notice> : <><EstadoConexao {...consulta}/><Choices options={['Campanhas', 'Denúncias', 'Repasses', 'Reembolsos']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Campanhas' ? consulta.dados?.campanhas.map(campanha => <Card key={campanha.id} title={campanha.titulo} subtitle={campanha.estado} onPress={() => roteador.push({ pathname: '/analise', params: { id: campanha.id } })}/>) : secao === 'Denúncias' ? <><Choices label="Situação das denúncias" options={['Pendentes', 'Analisadas']} selected={estadoRelatos} onSelect={definirEstadoRelatos}/>{denuncias?.map(denuncia => <Card key={denuncia.id} title={denuncia.motivo} subtitle={denuncia.campanha}><Tag>{denuncia.estado.toLocaleUpperCase()}</Tag><Copy>{denuncia.relato}</Copy><Button secondary title="Analisar campanha denunciada" onPress={() => roteador.push({ pathname: '/analise', params: { id: denuncia.campanha_id } })}/>{denuncia.estado === 'pendente' ? <Button secondary disabled={analisando !== null} title={analisando === denuncia.id ? 'Salvando...' : 'Marcar como analisada'} onPress={() => analisarDenuncia(denuncia.id)}/> : null}</Card>)}{denuncias?.length === 0 ? <EmptyState title="Nenhuma denúncia nesta situação.">Uma denúncia pede revisão; ela não comprova fraude e não oculta uma campanha automaticamente.</EmptyState> : null}</> : secao === 'Repasses' ? consulta.dados?.repasses.map(repasse => <Card key={repasse.id} title={repasse.campanha} subtitle={formatarDinheiro(repasse.valor / 100)} onPress={() => roteador.push({ pathname: '/operacao', params: { id: String(repasse.id), modo: 'Repasse' } })}/>) : consulta.dados?.pagamentos.map(pagamento => <Card key={pagamento.id} title={pagamento.campanha} subtitle={`${formatarDinheiro(pagamento.valor / 100)} · pagamento de teste confirmado`} onPress={() => roteador.push({ pathname: '/operacao', params: { id: String(pagamento.id), modo: 'Reembolso' } })}/>)}
      {erro ? <Notice error>{erro}</Notice> : null}<Copy muted>Repasses e reembolsos são simulações de apresentação.</Copy>
    </>}
  </Screen>;
}

export function Analysis() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const admin = usuarioLogado()?.administrador; const consulta = useDados<Campanha>(id && admin ? `/campanhas/${id}` : null);
  const relatos = useDados<Administracao>(id && admin ? '/administracao' : null);
  const [justificativa, definirJustificativa] = useState(''); const [decisao, definirDecisao] = useState('Pedir ajustes'); const [janela, definirJanela] = useState(false); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState('');
  async function confirmar() {
    definirOcupado(true);
    try { if (!justificativa.trim()) throw new Error('Informe a justificativa da decisão.'); await requisitar(`/administracao/campanhas/${id}`, 'PATCH', { estado: decisao === 'Publicar' ? 'ativa' : decisao === 'Suspender' ? 'suspensa' : 'ajustes', motivo: justificativa }); definirErro(''); definirJanela(false); definirMensagem('Decisão salva. A situação atual está indicada abaixo.'); consulta.atualizar(); }
    catch (problema) { definirErro(mensagemErro(problema)); definirMensagem(''); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Análise da campanha" heading="Avalie a campanha." subtitle={consulta.dados?.titulo}>
    {!usuarioLogado()?.administrador ? <Notice>Acesso exclusivo do administrador.</Notice> : !id ? <Notice>Selecione uma campanha na administração.</Notice> : <><EstadoConexao {...consulta}/>{consulta.dados ? <><Tag>{consulta.dados.estado.toLocaleUpperCase()}</Tag><Copy>{consulta.dados.descricao}</Copy>{consulta.dados.motivo ? <Copy muted>{consulta.dados.motivo}</Copy> : null}<Heading>Necessidades e recebimentos</Heading>{consulta.dados.necessidades.map(p => <Card key={p.id} title={p.nome} subtitle={p.tipo === 'dinheiro' ? `${formatarDinheiro(p.recebido / 100)} simulados · meta ${formatarDinheiro(p.meta / 100)}` : `${p.recebido} confirmados de ${p.meta}`}/>)}</> : null}<Heading>Denúncias desta campanha</Heading><EstadoConexao {...relatos}/>{relatos.dados?.denuncias.filter(d => d.campanha_id === id).map(d => <Card key={d.id} title={d.motivo} subtitle={d.estado}><Copy>{d.relato}</Copy></Card>)}<Tag>REVISÃO MANUAL · SEM IA</Tag><Copy muted>Suspender ou pedir ajustes oculta a campanha. Publicar restaura a visibilidade; uma campanha encerrada continua encerrada até a reabertura pelo responsável.</Copy><Field label="Justificativa da decisão *" multiline value={justificativa} onChangeText={definirJustificativa}/><Choices options={['Pedir ajustes', 'Publicar', 'Suspender']} selected={decisao} onSelect={definirDecisao}/><Button title="Revisar decisão" disabled={!consulta.dados || ocupado} onPress={() => definirJanela(true)}/>{mensagem ? <Notice success>{mensagem}</Notice> : null}{erro ? <Notice error>{erro}</Notice> : null}</>}
    <Dialog visible={janela} title="Confirmar decisão?" onClose={() => definirJanela(false)}><Copy>{decisao}: {justificativa}</Copy>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Confirmar decisão" disabled={ocupado} onPress={confirmar}/></Dialog>
  </Screen>;
}

export function FinancialOperation() {
  const { id, modo } = useLocalSearchParams<{ id?: string; modo?: string }>(); const reembolso = modo === 'Reembolso'; const consulta = useDados<Repasse | Pagamento>(id && usuarioLogado()?.administrador ? `${reembolso ? '/pagamentos' : '/repasses'}/${id}` : null);
  const [motivo, definirMotivo] = useState(''); const [acao, definirAcao] = useState(''); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function confirmar() {
    definirOcupado(true);
    try { if (!motivo.trim()) throw new Error('Informe a justificativa.'); await requisitar(reembolso ? `/pagamentos/${id}/simular` : `/repasses/${id}/decidir`, 'PATCH', reembolso ? { estado: 'reembolsado' } : { estado: acao === 'autorizar' ? 'concluido' : 'recusado', motivo }); definirAcao(''); definirMensagem('Operação de teste salva. Nenhum dinheiro real foi movimentado.'); consulta.atualizar(); }
    catch (problema) { definirMensagem(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Operação financeira" heading="Autorize com rastreio.">
    {!usuarioLogado()?.administrador ? <Notice>Acesso exclusivo do administrador.</Notice> : !id ? <Notice>Selecione uma operação na administração.</Notice> : <><EstadoConexao {...consulta}/>{consulta.dados ? <><Tag>{reembolso ? 'REEMBOLSO' : 'REPASSE'} · SIMULAÇÃO</Tag><Card title={consulta.dados.campanha || 'Operação de teste'} subtitle={`${formatarDinheiro(consulta.dados.valor / 100)} · ${consulta.dados.estado}`}/><Field label="Justificativa *" multiline value={motivo} onChangeText={definirMotivo}/>
      <Button title={reembolso ? 'Reembolsar pagamento de teste' : 'Concluir repasse de teste'} disabled={ocupado || ![reembolso ? 'confirmado' : 'solicitado'].includes(consulta.dados.estado)} onPress={() => definirAcao('autorizar')}/>
      {!reembolso ? <Button danger title="Recusar repasse" disabled={ocupado || consulta.dados.estado !== 'solicitado'} onPress={() => definirAcao('recusar')}/> : null}
    </> : null}</>}
    {mensagem ? <Notice>{mensagem}</Notice> : null}<Dialog visible={!!acao} title="Confirmar operação de teste?" onClose={() => definirAcao('')}><Copy>A decisão será salva no banco do projeto. Não há integração financeira.</Copy><Button title="Confirmar operação" disabled={ocupado} onPress={confirmar}/></Dialog>
  </Screen>;
}
