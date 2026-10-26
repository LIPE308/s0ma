import { useCallback, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Choices, Copy, Disclosure, Field, Notice, Screen } from '../components/ui';
import { Calendario } from '../components/calendario';
import { PedirLogin } from '../components/conexao';
import { categorias, converterValor, formatarDinheiro } from '../data/formatacao';
import { inicioDoDia, lerData } from '../data/calendario';
import { criarChaveOperacao, mensagemErro, requisitar, usuarioLogado, type Campanha } from '../servicos/api';
import { escolherImagem } from './inteligencia';

export function CriacaoSimples() {
  const router = useRouter(); const [etapa, definirEtapa] = useState(0);
  const [titulo, definirTitulo] = useState(''); const [descricao, definirDescricao] = useState(''); const [categoria, definirCategoria] = useState('Família');
  const [meta, definirMeta] = useState(''); const [prazo, definirPrazo] = useState(''); const [imagem, definirImagem] = useState('');
  const [regiao, definirRegiao] = useState(''); const [uf, definirUf] = useState('Não informar');
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false); const envio = useRef(criarChaveOperacao());
  const valor = Math.round(converterValor(meta) * 100);
  const voltar = useCallback(() => { if (ocupado) return; definirErro(''); definirEtapa(e => Math.max(0, e - 1)); }, [ocupado]);
  useFocusEffect(useCallback(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => { if (etapa > 0) { voltar(); return true; } return false; }); return () => listener.remove(); }, [etapa, voltar]));
  function continuar() {
    definirErro('');
    if (etapa === 0 && (!titulo.trim() || !descricao.trim())) { definirErro('Dê um nome à campanha e conte por que ela é importante.'); return; }
    if (etapa === 0 && (titulo.trim().length > 150 || descricao.length > 10000)) { definirErro('Use até 150 letras no nome e até 10.000 na história.'); return; }
    if (etapa === 1 && (!Number.isSafeInteger(valor) || valor < 1000 || valor > 100000000)) { definirErro('Informe uma meta entre R$ 10 e R$ 1.000.000.'); return; }
    if (etapa === 1 && prazo && (!lerData(prazo) || lerData(prazo)! < inicioDoDia())) { definirErro('Escolha hoje ou uma data futura. Você também pode deixar sem prazo.'); return; }
    definirEtapa(e => e + 1);
  }
  async function foto() { definirErro(''); definirOcupado(true); try { const escolhida = await escolherImagem(); if (escolhida) definirImagem(escolhida); } catch (e) { definirErro(mensagemErro(e)); } finally { definirOcupado(false); } }
  async function publicar() {
    definirOcupado(true); definirErro('');
    try {
      const campanha = await requisitar<Campanha>('/campanhas', 'POST', { titulo: titulo.trim(), descricao: descricao.trim(), categoria, regiao: regiao.trim(), uf: uf === 'Não informar' ? '' : uf, prazo, imagem: imagem || undefined, necessidades: [{ nome: titulo.trim(), tipo: 'dinheiro', meta: valor, tipo_meta: 'fechada', prioridade: 'Normal', prazo, descricao: '' }] }, envio.current);
      // Limpa somente após confirmação do servidor; falhas conservam todos os dados e a chave de reenvio.
      definirEtapa(0); definirTitulo(''); definirDescricao(''); definirMeta(''); definirPrazo(''); definirImagem(''); definirRegiao(''); definirUf('Não informar'); definirCategoria('Família'); envio.current = criarChaveOperacao();
      router.push({ pathname: '/preparar-campanha', params: { id: campanha.id } });
    } catch (e) { definirErro(mensagemErro(e)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Criar campanha" heading={['Qual é o seu objetivo?', 'Quanto você precisa?', 'Tudo pronto para começar?'][etapa]} step={`PASSO ${etapa + 1} DE 3`} back={etapa > 0} onBack={voltar}>
    {!usuarioLogado() ? <PedirLogin/> : <>
      {etapa === 0 ? <><Field label="Nome da campanha" value={titulo} onChangeText={definirTitulo} placeholder="Ex.: Livros para nossa comunidade"/><Field label="Conte por que essa campanha é importante" multiline value={descricao} onChangeText={definirDescricao} placeholder="Quem será ajudado e o que você quer realizar?"/><Choices label="Categoria" options={categorias} selected={categoria} onSelect={definirCategoria}/></> : etapa === 1 ? <><Field label="Quanto você precisa arrecadar? (R$)" numeric value={meta} onChangeText={definirMeta} placeholder="Ex.: 5.000,00"/><Calendario label="Até quando você gostaria de alcançar a meta?" value={prazo} onChange={definirPrazo} opcional/>{imagem ? <Image source={{ uri: imagem }} style={{ height: 180, borderRadius: 20 }} contentFit="cover" accessibilityLabel="Prévia da imagem da campanha"/> : null}<Copy muted>Ao escolher a foto, você autoriza o uso na campanha após revisão. Evite pessoas vulneráveis e informações sensíveis.</Copy><Button secondary title={ocupado ? 'Preparando imagem…' : imagem ? 'Trocar imagem (opcional)' : 'Adicionar imagem (opcional)'} disabled={ocupado} onPress={foto}/>{imagem ? <Button secondary title="Remover imagem" disabled={ocupado} onPress={() => definirImagem('')}/> : null}<Disclosure title="Adicionar localização (opcional)"><Field label="Cidade ou região (opcional)" value={regiao} onChangeText={definirRegiao}/><Choices label="Estado no Mapa Solidário" options={['Não informar', ...'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')]} selected={uf} onSelect={definirUf}/><Copy muted>Informe apenas uma região geral, sem endereço pessoal.</Copy></Disclosure></> : <><Card title={titulo} subtitle={categoria}>{imagem ? <Image source={{ uri: imagem }} style={{ height: 180, borderRadius: 16 }} contentFit="cover" accessibilityLabel="Prévia da sua campanha"/> : null}<Copy>{descricao}</Copy><Copy>Meta: {formatarDinheiro(valor / 100)}</Copy><Copy muted>{prazo ? `Data desejada: ${prazo}` : 'Sem prazo definido'}{regiao ? ` · ${regiao}` : ''}</Copy></Card><Notice>As contribuições financeiras ainda são de demonstração. Nenhum dinheiro real será cobrado ou recebido.</Notice><Copy muted>Você salvará um rascunho privado e preparará o envio para revisão. A publicação depende de aprovação.</Copy></>}
      {erro ? <Notice error>{erro}</Notice> : null}
      <Button title={etapa === 2 ? ocupado ? 'Criando campanha…' : 'Salvar rascunho e continuar' : 'Continuar'} disabled={ocupado} onPress={etapa === 2 ? publicar : continuar}/>
      {etapa > 0 ? <Button secondary title="Voltar e conferir" disabled={ocupado} onPress={voltar}/> : null}
      {etapa === 0 ? <Disclosure title="Preciso de objetos, voluntários ou mais de uma meta"><Copy>Você também pode organizar entregas, tarefas e encontros.</Copy><Button secondary title="Criar com outras formas de ajuda" onPress={() => { if (!titulo.trim() || !descricao.trim()) { definirErro('Preencha o nome e a história antes de continuar.'); return; } router.push({ pathname: '/pedidos', params: { titulo, descricao, categoria, avancado: '1' } }); }}/></Disclosure> : null}
    </>}
  </Screen>;
}
