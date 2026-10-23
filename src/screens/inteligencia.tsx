import { useState } from 'react';
import { Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Choices, Copy, Field, Heading, Line, Notice, Progress, Screen, Tag } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import Estrada from '../components/estrada';
import type { Marco } from '../components/estrada-base';
import { requisitar, useDados, usuarioLogado, mensagemErro, criarChaveOperacao } from '../servicos/api';
import { formatarDinheiro, converterValor } from '../data/formatacao';

export type Inteligencia = { campanha: string; meta: number; arrecadado: number; restante: number; percentual: number; doacoes: number; anuncios: number; rendimentos: number; saldo_disponivel: number; marcos: Marco[]; urgencia: { categoria: string; verificada: boolean }; uf: string; imagem: string };
const dinheiro = (centavos: number) => formatarDinheiro(centavos / 100);
export function RotaInteligente() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const consulta = useDados<Inteligencia>(id ? `/campanhas/${id}/inteligencia` : null);
  const [indice, selecionar] = useState<number | null>(null); const [modo, definirModo] = useState('Estrada');
  const [taxa, definirTaxa] = useState('0'); const [anuncios, definirAnuncios] = useState('0');
  const [projecao, definirProjecao] = useState<{ rendimento_estimado: number; anuncios_estimados: number } | null>(null);
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const dados = consulta.dados;
  const selecionado = indice ?? Math.max(0, dados?.marcos.findIndex(m => m.id.startsWith('financeiro') && !m.concluido) ?? 0);
  const marco = dados?.marcos[selecionado];
  async function projetar() { definirOcupado(true); definirErro(''); try { definirProjecao(await requisitar(`/campanhas/${id}/projecao`, 'POST', { taxa_mensal: converterValor(taxa), anuncios_mensais: Math.round(converterValor(anuncios) * 100), meses: 1 })); } catch (e) { definirErro(mensagemErro(e)); } finally { definirOcupado(false); } }
  return <Screen title="Rota Inteligente" heading="Cada gesto abre caminho." subtitle={dados?.campanha}>
    <EstadoConexao {...consulta}/>{!id ? <Notice>Abra a rota a partir de uma campanha.</Notice> : null}{dados ? <>
      <Tag>SIMULAÇÃO ACADÊMICA · SEM DINHEIRO REAL</Tag>
      <Card title={dinheiro(dados.arrecadado)} subtitle={`de ${dinheiro(dados.meta)} · ${dados.percentual.toFixed(1)}% da meta`}><Progress done={dados.arrecadado} total={dados.meta}/><Line label="Faltam" value={dinheiro(dados.restante)}/></Card>
      <Choices options={['Estrada', 'Lista acessível']} selected={modo} onSelect={definirModo}/>
      {modo === 'Estrada' ? <Estrada marcos={dados.marcos} percentual={dados.percentual} selecionado={selecionado} aoSelecionar={selecionar}/> : null}
      <Choices label="Selecionar marco da jornada" options={dados.marcos.map((m, i) => `${i + 1}. ${m.titulo}`)} selected={`${selecionado + 1}. ${marco?.titulo}`} onSelect={valor => selecionar(Number(valor.split('.')[0]) - 1)}/>
      {marco ? <Card title={marco.titulo} subtitle={marco.concluido ? 'Concluído no ambiente de teste' : 'Próximo passo, ainda não concluído'}><Line label="Valor do marco" value={marco.unidade === 'pessoas' ? `${marco.valor} apoiadores` : dinheiro(marco.valor)}/><Copy muted>{marco.data ? `Registrado em ${new Date(marco.data).toLocaleDateString('pt-BR')}` : marco.concluido ? 'Data de alcance indisponível no histórico legado.' : 'Sem data de alcance.'}</Copy>{marco.id.startsWith('financeiro') ? <Line label="Restante para este marco" value={dinheiro(Math.max(0, marco.valor - dados.arrecadado))}/> : <Copy muted>{marco.id === 'rendimento' ? 'Nenhum rendimento foi creditado. Não há integração com investimentos.' : marco.id === 'apoiadores' ? 'Apenas contribuições financeiras confirmadas ou ajudas com recebimento registrado contam como apoiadores.' : 'Só conclui após uma distribuição registrada no livro de anúncios de teste.'}</Copy>}<Copy muted>Próximo objetivo financeiro: {dados.marcos.find(m => m.id.startsWith('financeiro') && !m.concluido)?.titulo || 'Meta concluída'}</Copy></Card> : null}
      <Heading>O que já foi registrado</Heading><Card title="Contas transparentes"><Line label="Doações de teste confirmadas" value={dinheiro(dados.doacoes)}/><Line label="Anúncios distribuídos, simulados" value={dinheiro(dados.anuncios)}/><Line label="Rendimentos creditados" value={dinheiro(dados.rendimentos)}/><Line label="Saldo de pagamentos disponível no teste" value={dinheiro(dados.saldo_disponivel)}/><Copy muted>Anúncios têm livro próprio e não ficam disponíveis para repasse. A arrecadação da jornada soma os dois livros de teste.</Copy></Card>
      <Heading>Explore uma hipótese</Heading><Copy>Estimativa para um mês, sobre o saldo disponível dos pagamentos. As hipóteses começam em zero e são escolhidas por você.</Copy>
      <Field label="Hipótese de rendimento mensal (%) — 0 a 2" numeric value={taxa} onChangeText={v => { definirTaxa(v); definirProjecao(null); }}/><Field label="Hipótese mensal de anúncios (R$)" numeric value={anuncios} onChangeText={v => { definirAnuncios(v); definirProjecao(null); }}/><Button secondary title="Calcular estimativa" disabled={ocupado} onPress={projetar}/>
      {projecao ? <Card title="ESTIMATIVA · NÃO CREDITADA"><Line label="Rendimento hipotético no mês" value={dinheiro(projecao.rendimento_estimado)}/><Line label="Anúncios hipotéticos no mês" value={dinheiro(projecao.anuncios_estimados)}/><Line label="Progresso hipotético total" value={dinheiro(dados.arrecadado + projecao.rendimento_estimado + projecao.anuncios_estimados)}/><Copy muted>Taxa de {taxa}% ao mês e anúncios de R$ {anuncios}. Sem garantia, impostos, taxas ou novos repasses; não altera a meta registrada.</Copy></Card> : null}
      <Notice>Em uma emergência, priorize disponibilidade imediata. Avalie prazo, liquidez, risco de perda e custos antes de qualquer decisão. O Soma não investe recursos e não está conectado a um prestador de investimentos.</Notice>{erro ? <Notice error>{erro}</Notice> : null}
      <Card title="Anúncios que somam" subtitle="70% para campanhas críticas verificadas · 30% para manutenção"><Copy>Espaço reservado para publicidade. Sem rede conectada, sem anúncio exibido e sem receita real. O rateio de teste considera prazo, pontuação, valor necessário e distribuições anteriores, com limite de 35% do fundo por campanha.</Copy></Card>
    </> : null}
  </Screen>;
}

export async function escolherImagem() {
  const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: .3, base64: true });
  if (resultado.canceled) return null;
  const imagem = resultado.assets[0];
  const conteudo = `data:${imagem.mimeType || 'image/jpeg'};base64,${imagem.base64}`;
  if (conteudo.length > 70000) throw new Error('Selecione uma imagem menor (até 50 KB).');
  return conteudo;
}
export function RecursosCampanha({ id }: { id: string }) {
  const [relato, definirRelato] = useState(''); const [uf, definirUf] = useState('SP'); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const revisoes = useDados<{ id: number; relato: string; estado: string; categoria: string; justificativa: string }[]>(`/campanhas/${id}/urgencia`);
  async function salvar(tipo: string) { definirOcupado(true); try {
    if (tipo === 'urgencia') await requisitar(`/campanhas/${id}/urgencia`, 'POST', { relato });
    else if (tipo === 'localizacao') await requisitar(`/campanhas/${id}/localizacao`, 'PUT', { uf });
    else { const imagem = await escolherImagem(); if (!imagem) return; await requisitar(`/campanhas/${id}/imagem`, 'PUT', { imagem }); }
    definirMensagem('Informação salva.'); revisoes.atualizar();
  } catch (e) { definirMensagem(mensagemErro(e)); } finally { definirOcupado(false); } }
  return <><Heading>Cuide da apresentação e da confiança</Heading><Choices label="Estado público no mapa (opcional)" options={'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')} selected={uf} onSelect={definirUf}/><Button secondary title="Salvar estado no mapa" disabled={ocupado} onPress={() => salvar('localizacao')}/><Button secondary title="Adicionar foto da campanha" disabled={ocupado} onPress={() => salvar('imagem')}/><Field label="Solicitar análise ou recorrer: gravidade, consequências, prazo e evidências" multiline value={relato} onChangeText={definirRelato}/><Copy muted>Não publique documentos médicos, CPF ou endereços. Cite referências para revisão privada pela equipe. Nova solicitação suspende a prioridade anterior até revisão.</Copy><Button secondary title="Solicitar revisão humana de urgência" disabled={ocupado || !relato.trim()} onPress={() => salvar('urgencia')}/><EstadoConexao {...revisoes}/>{revisoes.dados?.map(r => <Card key={r.id} title={r.estado === 'pendente' ? 'Revisão pendente' : r.categoria} subtitle={r.justificativa || 'A equipe avaliará as evidências.'}/>)}{mensagem ? <Notice>{mensagem}</Notice> : null}</>;
}

type Painel = { revisoes: { id: number; titulo: string; relato: string; estado: string; categoria: string; pontos: number; justificativa: string }[]; receitas: { id: number; referencia: string; valor: number; resultado: string }[] };
export function SolidariedadeAdmin() {
  const consulta = useDados<Painel>(usuarioLogado()?.administrador ? '/administracao/solidariedade' : null);
  const [id, definirId] = useState<number | null>(null); const [gravidade, definirGravidade] = useState('0'); const [impacto, definirImpacto] = useState('0'); const [documentos, definirDocumentos] = useState('Não'); const [consistente, definirConsistente] = useState('Não'); const [justificativa, definirJustificativa] = useState('');
  const [valor, definirValor] = useState('100,00'); const [referencia, definirReferencia] = useState(''); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false); const [chave, definirChave] = useState(criarChaveOperacao);
  async function executar(revisao: boolean) { definirOcupado(true); definirMensagem(''); try {
    if (revisao) { await requisitar(`/administracao/solidariedade/urgencia/${id}`, 'PATCH', { gravidade: Number(gravidade), impacto: Number(impacto), documentos: documentos === 'Sim', consistente: consistente === 'Sim', justificativa }); definirId(null); }
    else { const rateio = await requisitar<{ fundo: number; manutencao: number; retido: number }>('/administracao/solidariedade/simular', 'POST', { valor: Math.round(converterValor(valor) * 100), referencia }, chave); definirMensagem(`SIMULADO: fundo ${dinheiro(rateio.fundo)}, manutenção ${dinheiro(rateio.manutencao)}, retido ${dinheiro(rateio.retido)}.`); definirChave(criarChaveOperacao()); definirReferencia(''); }
    consulta.atualizar();
  } catch (e) { definirMensagem(mensagemErro(e)); } finally { definirOcupado(false); } }
  return <Screen title="Fundo solidário e urgência" heading="Decisões com registro.">{!usuarioLogado()?.administrador ? <Notice>Acesso exclusivo da administração.</Notice> : <><EstadoConexao {...consulta}/><Heading>Revisões humanas</Heading><Copy>Gravidade e consequência: 0 (ausente), 1 (baixa), 2 (grave), 3 (extrema). Somente marque evidências verificadas após conferência humana. Solicitações não são provas por si só.</Copy>{consulta.dados?.revisoes.map(r => <Card key={r.id} title={r.titulo} subtitle={r.estado === 'pendente' ? 'Aguardando revisão' : `${r.categoria} · ${r.pontos}/100`}><Copy>{r.relato}</Copy>{r.justificativa ? <Copy>{r.justificativa}</Copy> : null}{r.estado === 'pendente' ? <Button secondary title="Revisar evidências" onPress={() => { definirId(r.id); definirGravidade('0'); definirImpacto('0'); definirDocumentos('Não'); definirConsistente('Não'); definirJustificativa(''); }}/> : null}</Card>)}{id ? <Card title={`Revisão #${id}`}><Choices label="Gravidade comprovada" options={['0', '1', '2', '3']} selected={gravidade} onSelect={definirGravidade}/><Choices label="Consequência comprovada" options={['0', '1', '2', '3']} selected={impacto} onSelect={definirImpacto}/><Choices label="Evidências conferidas?" options={['Não', 'Sim']} selected={documentos} onSelect={definirDocumentos}/><Choices label="Informações consistentes?" options={['Não', 'Sim']} selected={consistente} onSelect={definirConsistente}/><Field label="Justificativa e referências privadas da revisão" multiline value={justificativa} onChangeText={definirJustificativa}/><Button title="Registrar decisão humana" disabled={ocupado} onPress={() => executar(true)}/></Card> : null}<Heading>Receita líquida elegível de teste</Heading><Notice>Simulação isolada. Não registre faturamento real aqui. Distribuições não aumentam o saldo sacável de pagamentos.</Notice><Field label="Referência única da receita simulada" value={referencia} onChangeText={definirReferencia}/><Field label="Receita simulada em R$" numeric value={valor} onChangeText={definirValor}/><Button title="Registrar receita e distribuir simulação" disabled={ocupado} onPress={() => executar(false)}/>{consulta.dados?.receitas.map(r => { const rateio = JSON.parse(r.resultado); return <Card key={r.id} title={`${r.referencia} · ${dinheiro(r.valor)}`} subtitle="SIMULADO · divisão 70/30"><Line label="Fundo" value={dinheiro(rateio.fundo)}/><Line label="Manutenção" value={dinheiro(rateio.manutencao)}/><Line label="Retido por limites ou falta de elegíveis" value={dinheiro(rateio.retido)}/>{rateio.distribuicoes.map((d: { campanha_id: string; valor: number }) => <Line key={d.campanha_id} label={d.campanha_id} value={dinheiro(d.valor)}/>)}</Card>; })}{mensagem ? <Notice>{mensagem}</Notice> : null}</>}</Screen>;
}

export function CampanhaInteligencia({ id }: { id: string }) {
  const roteador = useRouter(); const consulta = useDados<Inteligencia>(`/campanhas/${id}/inteligencia`);
  const d = consulta.dados;
  return <>{d?.imagem ? <Image source={{ uri: d.imagem }} style={{ height: 240, borderRadius: 22 }} contentFit="cover" accessibilityLabel="Foto enviada pelo responsável da campanha"/> : null}{d ? <Tag>{`${d.urgencia.categoria} · ${d.urgencia.verificada ? 'revisão humana vigente' : 'sem verificação vigente'}`}</Tag> : null}<Button secondary title="Percorrer a Rota Inteligente" onPress={() => roteador.push({ pathname: '/rota-inteligente', params: { id } })}/><Button secondary title="Compartilhar campanha" onPress={() => { void Share.share({ message: `${d?.campanha || 'Conheça esta campanha no Soma'}${typeof window !== 'undefined' ? ` ${window.location.origin}/campanha?id=${encodeURIComponent(id)}` : ` soma://campanha?id=${encodeURIComponent(id)}`}` }).catch(() => {}); }}/></>;
}
