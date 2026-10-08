import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Dialog, Field, Notice, Screen, Tag } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { useDados, requisitar, usuarioLogado, mensagemErro, type Administracao, type Campanha, type Repasse, type Pagamento } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';

export function Admin() {
  const roteador = useRouter(); const pessoa = usuarioLogado(); const consulta = useDados<Administracao>(pessoa?.administrador ? '/administracao' : null); const [secao, definirSecao] = useState('Campanhas'); const [erro, definirErro] = useState('');
  async function analisarDenuncia(id: number) { try { await requisitar(`/administracao/denuncias/${id}`, 'PATCH'); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } }
  return <Screen title="Administração" heading="Controle por exceção.">
    {!pessoa ? <PedirLogin/> : !pessoa.administrador ? <Notice>Esta área é exclusiva do administrador.</Notice> : <><EstadoConexao {...consulta}/><Choices options={['Campanhas', 'Denúncias', 'Repasses', 'Reembolsos']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Campanhas' ? consulta.dados?.campanhas.map(campanha => <Card key={campanha.id} title={campanha.titulo} subtitle={campanha.estado} onPress={() => roteador.push({ pathname: '/analise', params: { id: campanha.id } })}/>) : secao === 'Denúncias' ? consulta.dados?.denuncias.map(denuncia => <Card key={denuncia.id} title={denuncia.motivo} subtitle={denuncia.campanha}><Copy>{denuncia.relato}</Copy><Button secondary title="Marcar como analisada" onPress={() => analisarDenuncia(denuncia.id)}/></Card>) : secao === 'Repasses' ? consulta.dados?.repasses.map(repasse => <Card key={repasse.id} title={repasse.campanha} subtitle={formatarDinheiro(repasse.valor / 100)} onPress={() => roteador.push({ pathname: '/operacao', params: { id: String(repasse.id), modo: 'Repasse' } })}/>) : consulta.dados?.pagamentos.map(pagamento => <Card key={pagamento.id} title={pagamento.campanha} subtitle={`${formatarDinheiro(pagamento.valor / 100)} · pagamento de teste confirmado`} onPress={() => roteador.push({ pathname: '/operacao', params: { id: String(pagamento.id), modo: 'Reembolso' } })}/>)}
      {erro ? <Notice error>{erro}</Notice> : null}<Copy muted>Repasses e reembolsos são simulações de apresentação.</Copy>
    </>}
  </Screen>;
}

export function Analysis() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Campanha>(id ? `/campanhas/${id}` : null);
  const [justificativa, definirJustificativa] = useState(''); const [decisao, definirDecisao] = useState('Pedir ajustes'); const [janela, definirJanela] = useState(false); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function confirmar() {
    definirOcupado(true);
    try { await requisitar(`/administracao/campanhas/${id}`, 'PATCH', { estado: decisao === 'Publicar' ? 'ativa' : decisao === 'Suspender' ? 'suspensa' : 'ajustes', motivo: justificativa }); definirJanela(false); definirMensagem('Decisão salva.'); consulta.atualizar(); }
    catch (problema) { definirMensagem(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Análise da campanha" heading="Avalie a campanha." subtitle={consulta.dados?.titulo}>
    {!usuarioLogado()?.administrador ? <Notice>Acesso exclusivo do administrador.</Notice> : !id ? <Notice>Selecione uma campanha na administração.</Notice> : <><EstadoConexao {...consulta}/><Copy>{consulta.dados?.descricao}</Copy><Tag>REVISÃO MANUAL · SEM IA</Tag><Field label="Justificativa da decisão *" multiline value={justificativa} onChangeText={definirJustificativa}/><Choices options={['Pedir ajustes', 'Publicar', 'Suspender']} selected={decisao} onSelect={definirDecisao}/><Button title="Revisar decisão" onPress={() => definirJanela(true)}/>{mensagem ? <Notice>{mensagem}</Notice> : null}</>}
    <Dialog visible={janela} title="Confirmar decisão?" onClose={() => definirJanela(false)}><Copy>{decisao}: {justificativa}</Copy><Button title="Confirmar decisão" disabled={ocupado} onPress={confirmar}/></Dialog>
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
  return <Screen title="Operação financeira" heading="Autorize com rastreio.">
    {!usuarioLogado()?.administrador ? <Notice>Acesso exclusivo do administrador.</Notice> : !id ? <Notice>Selecione uma operação na administração.</Notice> : <><EstadoConexao {...consulta}/>{consulta.dados ? <><Tag>{reembolso ? 'REEMBOLSO' : 'REPASSE'} · SIMULAÇÃO</Tag><Card title={consulta.dados.campanha || 'Operação de teste'} subtitle={`${formatarDinheiro(consulta.dados.valor / 100)} · ${consulta.dados.estado}`}/><Field label="Justificativa *" multiline value={motivo} onChangeText={definirMotivo}/>
      <Button title={reembolso ? 'Reembolsar pagamento de teste' : 'Concluir repasse de teste'} disabled={ocupado || ![reembolso ? 'confirmado' : 'solicitado'].includes(consulta.dados.estado)} onPress={() => definirAcao('autorizar')}/>
      {!reembolso ? <Button danger title="Recusar repasse" disabled={ocupado || consulta.dados.estado !== 'solicitado'} onPress={() => definirAcao('recusar')}/> : null}
    </> : null}</>}
    {mensagem ? <Notice>{mensagem}</Notice> : null}<Dialog visible={!!acao} title="Confirmar operação de teste?" onClose={() => definirAcao('')}><Copy>A decisão será salva no banco do projeto. Não há integração financeira.</Copy><Button title="Confirmar operação" disabled={ocupado} onPress={confirmar}/></Dialog>
  </Screen>;
}
