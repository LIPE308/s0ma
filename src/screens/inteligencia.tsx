import { useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Button, Card, Choices, Copy, Disclosure, Field, Heading, Line, Notice, Progress, Screen, Tag } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import Estrada from '../components/estrada';
import { EstradaAlternativa, type Marco } from '../components/estrada-base';
import { indiceAtual, marcosDaEstrada } from '../data/rota';
import { requisitar, useDados, usuarioLogado, mensagemErro, criarChaveOperacao } from '../servicos/api';
import { formatarDinheiro, converterValor } from '../data/formatacao';

export type Inteligencia = { campanha: string; categoria?: string; estado?: string; meta: number; arrecadado: number; restante: number; percentual: number; doacoes: number; anuncios: number; rendimentos: number; saldo_disponivel: number; marcos: Marco[]; urgencia: { categoria: string; verificada: boolean }; uf: string; imagem: string };
const dinheiro = (centavos: number) => formatarDinheiro(centavos / 100);
export function RotaInteligente() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const consulta = useDados<Inteligencia>(id ? `/campanhas/${id}/inteligencia` : null);
  const dados = consulta.dados;
  const marcos = useMemo(() => dados ? marcosDaEstrada(dados.marcos, dados.campanha, dados.categoria) : [], [dados]);
  const atual = indiceAtual(marcos);
  const [indice, selecionar] = useState<number | null>(null); const [modo, definirModo] = useState('Estrada 3D');
  const selecionado = Math.min(indice ?? atual, Math.max(0, marcos.length - 1)); const marco = marcos[selecionado];
  const planejamento = !!dados?.estado && !['ativa', 'encerrada'].includes(dados.estado);
  const [taxa, definirTaxa] = useState('0'); const [anuncios, definirAnuncios] = useState('0');
  const [projecao, definirProjecao] = useState<{ rendimento_estimado: number; anuncios_estimados: number } | null>(null);
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  useEffect(() => { definirProjecao(null); }, [dados?.arrecadado, dados?.saldo_disponivel]);
  async function projetar() { definirOcupado(true); definirErro(''); try { definirProjecao(await requisitar(`/campanhas/${id}/projecao`, 'POST', { taxa_mensal: converterValor(taxa), anuncios_mensais: Math.round(converterValor(anuncios) * 100), meses: 1 })); } catch (e) { definirErro(mensagemErro(e)); } finally { definirOcupado(false); } }
  return <Screen title="Rota Inteligente" heading="Seu caminho até a meta." subtitle={dados?.campanha}>
    <EstadoConexao {...consulta}/>{!id ? <Notice>Escolha uma campanha para abrir sua rota.</Notice> : null}{dados ? <>
      <Tag>{planejamento ? 'PLANEJAMENTO · CAMPANHA NÃO PÚBLICA' : 'DEMONSTRAÇÃO · SEM DINHEIRO REAL'}</Tag>
      {planejamento ? <Notice>A campanha ainda não está pública. Você pode planejar sua rota enquanto aguarda a revisão.</Notice> : null}
      <Card title={dinheiro(dados.arrecadado)} subtitle={`de ${dinheiro(dados.meta)} · ${dados.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da meta`}><Progress done={dados.arrecadado} total={dados.meta}/><Copy muted>Faltam {dinheiro(dados.restante)} para realizar esse objetivo.</Copy></Card>
      {dados.meta > 0 ? <>
        <Copy>Sua meta no horizonte: {dados.campanha}</Copy>
        <Choices label="Como ver a rota" options={['Estrada 3D', 'Versão leve', 'Lista']} selected={modo} onSelect={definirModo}/>
        {modo === 'Estrada 3D' ? <Estrada marcos={marcos} percentual={dados.percentual} selecionado={selecionado} aoSelecionar={selecionar}/> : modo === 'Versão leve' ? <EstradaAlternativa marcos={marcos} percentual={dados.percentual} selecionado={selecionado} aoSelecionar={selecionar}/> : null}
        <Copy muted>Toque em um objetivo. A câmera permanece estável para você se orientar.</Copy>
        {marco ? <Card title={marco.titulo} subtitle={`${marco.concluido ? 'Concluído' : selecionado === atual ? 'Objetivo atual' : 'Futuro'} · ${dinheiro(marco.valor)}`}><Copy>{marco.concluido ? marco.data ? `Alcançado em ${new Date(marco.data).toLocaleDateString('pt-BR')}.` : 'Conquista registrada. A data não está disponível.' : `Faltam ${dinheiro(Math.max(0, marco.valor - dados.arrecadado))} para este objetivo.`}</Copy><Copy muted>Objetivo {selecionado + 1} de {marcos.length}</Copy><Button secondary title="Objetivo anterior" disabled={selecionado === 0} onPress={() => selecionar(selecionado - 1)}/><Button title="Próximo objetivo" disabled={selecionado === marcos.length - 1} onPress={() => selecionar(selecionado + 1)}/></Card> : null}
        <Disclosure key={modo} title="Ver todos os objetivos" initiallyOpen={modo === 'Lista'}>{marcos.map((m, i) => <Button key={m.id} secondary={selecionado !== i} title={`${m.titulo} · ${dinheiro(m.valor)} · ${m.concluido ? 'concluído' : i === atual ? 'atual' : 'futuro'}`} onPress={() => selecionar(i)}/>)}</Disclosure>
      </> : <Notice>Esta campanha recebe objetos ou tempo. Suas ajudas continuam disponíveis na campanha; a estrada financeira aparece quando houver uma meta em dinheiro.</Notice>}
      <Disclosure title="De onde vem cada valor"><Line label="Doações confirmadas no teste" value={dinheiro(dados.doacoes)}/><Line label="Anúncios distribuídos no teste" value={dinheiro(dados.anuncios)}/><Line label="Rendimentos creditados" value={dinheiro(dados.rendimentos)}/><Line label="Saldo de pagamentos disponível no teste" value={dinheiro(dados.saldo_disponivel)}/><Copy muted>Anúncios têm registro separado e não podem ser sacados pelo fluxo de pagamentos. Nenhum valor desta demonstração representa dinheiro real.</Copy></Disclosure>
      <Disclosure title="Outras conquistas da campanha">{dados.marcos.filter(m => !marcos.some(p => p.id === m.id)).map(m => <Card key={m.id} title={m.titulo} subtitle={m.concluido ? 'Concluído no teste' : 'Ainda não aconteceu'}><Copy muted>{m.unidade === 'pessoas' ? `${m.valor} apoiadores confirmados` : dinheiro(m.valor)}</Copy></Card>)}</Disclosure>
      <Disclosure title="Simular possibilidades para a meta"><Copy>Escolha suas hipóteses para um mês. Elas começam em zero e não alteram a arrecadação.</Copy><Field label="Rendimento mensal que deseja simular (%) — 0 a 2" numeric value={taxa} onChangeText={v => { definirTaxa(v); definirProjecao(null); }}/><Field label="Anúncios mensais que deseja simular (R$)" numeric value={anuncios} onChangeText={v => { definirAnuncios(v); definirProjecao(null); }}/><Button secondary title="Calcular estimativa" disabled={ocupado} onPress={projetar}/>{projecao ? <Card title="ESTIMATIVA · NÃO RECEBIDA"><Line label="Rendimento hipotético" value={dinheiro(projecao.rendimento_estimado)}/><Line label="Anúncios hipotéticos" value={dinheiro(projecao.anuncios_estimados)}/><Line label="Progresso hipotético total" value={dinheiro(dados.arrecadado + projecao.rendimento_estimado + projecao.anuncios_estimados)}/><Copy muted>Hipóteses: {taxa}% ao mês e R$ {anuncios} de anúncios. Sem garantia, impostos, taxas ou novos repasses.</Copy></Card> : null}<Notice>Em emergências, ter os recursos disponíveis agora é mais importante. O Soma não faz investimentos.</Notice></Disclosure>
      <Disclosure title="Como os anúncios ajudam"><Copy>70% da receita líquida elegível é destinada a campanhas emergenciais verificadas; 30% mantém o Soma. A distribuição considera prazo, necessidade e recursos já recebidos, com limite por campanha.</Copy><Copy muted>A rede publicitária ainda não está conectada. Receitas e distribuições nesta versão são apenas simuladas.</Copy></Disclosure>
      {erro ? <Notice error>{erro}</Notice> : null}<Button secondary title="Atualizar minha rota" onPress={() => { definirProjecao(null); consulta.atualizar(); }}/>
    </> : null}
  </Screen>;
}

export async function escolherImagem() {
  const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: .8 });
  if (resultado.canceled) return null;
  const imagem = resultado.assets[0];
  for (const [largura, qualidade] of [[800, .65], [600, .5], [400, .4], [240, .3]]) {
    const ajustada = await manipulateAsync(imagem.uri, [{ resize: { width: Math.min(largura, imagem.width || largura) } }], { compress: qualidade, format: SaveFormat.JPEG, base64: true });
    const conteudo = `data:image/jpeg;base64,${ajustada.base64}`;
    if (ajustada.base64 && conteudo.length <= 70000) return conteudo;
  }
  throw new Error('Não conseguimos preparar essa imagem. Tente outra foto.');
}
export function RecursosCampanha({ id }: { id: string }) {
  const [relato, definirRelato] = useState(''); const [uf, definirUf] = useState('Escolher estado'); const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const localizacao = useDados<Inteligencia>(`/campanhas/${id}/inteligencia`);
  useEffect(() => { if (localizacao.dados) definirUf(localizacao.dados.uf || 'Escolher estado'); }, [localizacao.dados]);
  const revisoes = useDados<{ id: number; relato: string; estado: string; categoria: string; justificativa: string }[]>(`/campanhas/${id}/urgencia`);
  async function salvar(tipo: string) { definirOcupado(true); try {
    if (tipo === 'urgencia') await requisitar(`/campanhas/${id}/urgencia`, 'POST', { relato });
    else if (tipo === 'localizacao') await requisitar(`/campanhas/${id}/localizacao`, 'PUT', { uf });
    else { const imagem = await escolherImagem(); if (!imagem) return; await requisitar(`/campanhas/${id}/imagem`, 'PUT', { imagem }); }
    definirMensagem('Informação salva.'); revisoes.atualizar();
  } catch (e) { definirMensagem(mensagemErro(e)); } finally { definirOcupado(false); } }
  return <><Heading>Cuide da apresentação e da confiança</Heading><Choices label="Estado público no mapa (opcional)" options={['Escolher estado', ...'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')]} selected={uf} onSelect={definirUf}/><Button secondary title="Salvar estado no mapa" disabled={ocupado || uf === 'Escolher estado' || localizacao.carregando || !!localizacao.erro} onPress={() => salvar('localizacao')}/><Button secondary title="Adicionar foto da campanha" disabled={ocupado} onPress={() => salvar('imagem')}/><Field label="Solicitar análise ou recorrer: gravidade, consequências, prazo e evidências" multiline value={relato} onChangeText={definirRelato}/><Copy muted>Não publique documentos médicos, CPF ou endereços. Cite referências para revisão privada pela equipe. Nova solicitação suspende a prioridade anterior até revisão.</Copy><Button secondary title="Solicitar revisão humana de urgência" disabled={ocupado || !relato.trim()} onPress={() => salvar('urgencia')}/><EstadoConexao {...revisoes}/>{revisoes.dados?.map(r => <Card key={r.id} title={r.estado === 'pendente' ? 'Revisão pendente' : r.categoria} subtitle={r.justificativa || 'A equipe avaliará as evidências.'}/>)}{mensagem ? <Notice>{mensagem}</Notice> : null}</>;
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
