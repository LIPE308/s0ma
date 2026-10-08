import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Dialog, Field, Line, Metric, Notice, Screen, Tag } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { converterValor, formatarDinheiro } from '../data/formatacao';
import { useDados, requisitar, usuarioLogado, mensagemErro, type Necessidade, type Pagamento, type Repasse, type Saldo } from '../servicos/api';

export function Donation() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Necessidade>(`/necessidades/${id || 'equipamento'}`);
  const [valor, definirValor] = useState('100,00'); const [meio, definirMeio] = useState('Pix'); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const centavos = Math.round(converterValor(valor) * 100); const taxa = Math.round(centavos * 0.04);
  async function continuar() {
    definirOcupado(true);
    try { if (!Number.isSafeInteger(centavos) || centavos < 1000) throw new Error('Informe pelo menos R$ 10,00.'); const pagamento = await requisitar<{ id: number }>('/pagamentos', 'POST', { necessidade_id: id || 'equipamento', valor: centavos, meio }); roteador.replace({ pathname: '/pagamento', params: { id: String(pagamento.id) } }); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Doação financeira" heading="Quanto você quer somar?" subtitle={consulta.dados?.nome}><EstadoConexao {...consulta}/>
    {!usuarioLogado() ? <PedirLogin/> : consulta.dados ? <><Tag>SIMULAÇÃO ACADÊMICA</Tag>
      <Field label="Valor em reais *" numeric value={valor} onChangeText={definirValor}/><Choices options={['20,00', '50,00', '100,00']} selected={valor} onSelect={definirValor}/><Choices options={['Pix', 'Crédito', 'Débito']} selected={meio} onSelect={definirMeio}/>
      <Card title="Resumo do teste" icon="wallet-outline"><Line label="Valor" value={formatarDinheiro(Number.isFinite(centavos) ? centavos / 100 : 0)}/><Line label="Taxa Soma · 4%" value={formatarDinheiro(Number.isFinite(taxa) ? taxa / 100 : 0)}/><Line label="Tarifa fictícia" value="R$ 3,00"/><Line label="Líquido" value={formatarDinheiro(Number.isFinite(centavos) ? Math.max(0, centavos - taxa - 300) / 100 : 0)}/></Card>
      <Notice>O pedido será salvo no MySQL. Não há cobrança nem provedor de pagamento conectado.</Notice>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Criar pagamento de teste" disabled={ocupado} onPress={continuar}/>
    </> : null}
  </Screen>;
}

export function Payment() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Pagamento>(id && usuarioLogado() ? `/pagamentos/${id}` : null); const pagamento = consulta.dados;
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function simular(estado: string) { definirOcupado(true); try { await requisitar(`/pagamentos/${id}/simular`, 'PATCH', { estado }); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); } }
  return <Screen variant="ledger" title="Pagamento" heading="Pagamento de teste." subtitle={pagamento?.campanha}>
    {!usuarioLogado() ? <PedirLogin/> : !id ? <Notice>Selecione um pagamento na sua atividade.</Notice> : <><EstadoConexao {...consulta}/>{pagamento ? <><Tag>{pagamento.estado.toLocaleUpperCase()} · SIMULADO</Tag><Card title={formatarDinheiro(pagamento.valor / 100)} subtitle={`${pagamento.meio} · ${pagamento.necessidade}`}><Line label="Taxa Soma" value={formatarDinheiro(pagamento.taxa_soma / 100)}/><Line label="Tarifa fictícia" value={formatarDinheiro(pagamento.taxa_provedor / 100)}/><Line label="Líquido para a meta" value={formatarDinheiro(pagamento.valor_liquido / 100)}/></Card>
      <Notice>A confirmação de teste atualiza a meta e o saldo no MySQL. Não existe Pix, cartão ou movimentação de dinheiro real.</Notice>
      {pagamento.estado === 'pendente' ? <><Button title="Simular confirmação" disabled={ocupado} onPress={() => simular('confirmado')}/><Button secondary title="Cancelar pagamento de teste" disabled={ocupado} onPress={() => simular('cancelado')}/></> : null}
      {erro ? <Notice error>{erro}</Notice> : null}<Button secondary title="Atualizar status" onPress={consulta.atualizar}/><Button title="Minha atividade" onPress={() => roteador.replace('/atividade')}/>
    </> : null}</>}
  </Screen>;
}

export function Balance() {
  const roteador = useRouter(); const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const identificador = campanha || 'biblioteca'; const consulta = useDados<Saldo>(usuarioLogado() ? `/campanhas/${identificador}/saldo` : null); const saldo = consulta.dados;
  return <Screen variant="ledger" title="Saldo e repasses" heading="Cada valor tem um estado." subtitle={saldo?.campanha}>
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{saldo ? <><Tag>SALDO SIMULADO</Tag><Metric label="Disponível no teste" value={formatarDinheiro(saldo.disponivel / 100)}/><Card title="Resumo da campanha" icon="wallet-outline"><Line label="Líquido confirmado" value={formatarDinheiro(saldo.confirmado / 100)}/><Line label="Solicitações reservadas" value={formatarDinheiro(saldo.reservado / 100)}/><Line label="Repasses concluídos" value={formatarDinheiro(saldo.repassado / 100)}/></Card>
      {saldo.repasses.map(repasse => <Card key={repasse.id} title={formatarDinheiro(repasse.valor / 100)} subtitle={repasse.estado} onPress={() => roteador.push({ pathname: '/repasse', params: { id: String(repasse.id) } })}/>)}
      <Copy muted>Os registros são salvos no banco. Os valores representam uma simulação acadêmica.</Copy><Button title="Solicitar repasse de teste" disabled={saldo.disponivel <= 0} onPress={() => roteador.push({ pathname: '/solicitar-repasse', params: { campanha: identificador } })}/>
    </> : null}</>}
  </Screen>;
}

export function RequestTransfer() {
  const roteador = useRouter(); const { campanha } = useLocalSearchParams<{ campanha?: string }>(); const identificador = campanha || 'biblioteca'; const consulta = useDados<Saldo>(usuarioLogado() ? `/campanhas/${identificador}/saldo` : null);
  const [valor, definirValor] = useState('250,00'); const [finalidade, definirFinalidade] = useState(''); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function solicitar() {
    definirOcupado(true);
    try { const centavos = Math.round(converterValor(valor) * 100); if (!Number.isSafeInteger(centavos) || centavos <= 0) throw new Error('Informe um valor maior que zero.'); const repasse = await requisitar<{ id: number }>('/repasses', 'POST', { campanha_id: identificador, valor: centavos, finalidade }); roteador.replace({ pathname: '/repasse', params: { id: String(repasse.id) } }); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Solicitar repasse" heading="Ajuda pode chegar agora.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{consulta.dados ? <><Copy>Disponível no teste: {formatarDinheiro(consulta.dados.disponivel / 100)}</Copy><Field label="Valor em reais *" numeric value={valor} onChangeText={definirValor}/><Field label="Finalidade *" multiline value={finalidade} onChangeText={definirFinalidade}/><Notice>A solicitação reserva saldo no sistema e aguarda decisão do administrador. Não ocorre transferência bancária.</Notice>{erro ? <Notice error>{erro}</Notice> : null}<Button title="Salvar solicitação de teste" disabled={ocupado} onPress={solicitar}/></> : null}</>}
  </Screen>;
}

export function TransferDetails() {
  const roteador = useRouter(); const { id } = useLocalSearchParams<{ id?: string }>(); const consulta = useDados<Repasse>(id && usuarioLogado() ? `/repasses/${id}` : null); const repasse = consulta.dados;
  const [janela, definirJanela] = useState(false); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function cancelar() { definirOcupado(true); try { await requisitar(`/repasses/${id}/cancelar`, 'PATCH'); definirJanela(false); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); } }
  return <Screen variant="ledger" title="Detalhe do repasse" heading="Solicitação de teste." subtitle={repasse?.campanha}>
    {!usuarioLogado() ? <PedirLogin/> : !id ? <Notice>Selecione uma solicitação na tela de saldo.</Notice> : <><EstadoConexao {...consulta}/>{repasse ? <><Tag>{repasse.estado.toLocaleUpperCase()} · SIMULADO</Tag><Card title={formatarDinheiro(repasse.valor / 100)} subtitle={repasse.finalidade}/>{repasse.motivo ? <Copy>{repasse.motivo}</Copy> : null}<Notice>O estado está salvo no MySQL. Nenhum dinheiro real foi transferido.</Notice>{repasse.estado === 'solicitado' ? <Button danger title="Cancelar solicitação" onPress={() => definirJanela(true)}/> : null}<Button secondary title="Voltar ao saldo" onPress={() => roteador.replace({ pathname: '/saldo', params: { campanha: repasse.campanha_id } })}/></> : null}</>}
    <Dialog visible={janela} title="Cancelar esta solicitação?" onClose={() => definirJanela(false)}><Copy>O saldo reservado voltará a ficar disponível no sistema.</Copy>{erro ? <Notice error>{erro}</Notice> : null}<Button danger title="Confirmar cancelamento" disabled={ocupado} onPress={cancelar}/></Dialog>
  </Screen>;
}

export function Surplus() {
  const roteador = useRouter();
  return <Screen title="Meta financeira" heading="A meta fechada tem um limite."><Notice>Nesta versão básica, o servidor recusa pagamentos de teste que ultrapassem o restante da meta fechada. Pagamentos pendentes já reservam esse restante.</Notice><Copy>Não há fluxo automático de excedentes ou prazo de reembolso. O administrador pode registrar o reembolso de um pagamento de teste confirmado, se houver saldo disponível.</Copy><Button title="Minha atividade" onPress={() => roteador.replace('/atividade')}/></Screen>;
}
