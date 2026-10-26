import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Choices, Copy, EmptyState, Field, Heading, Notice, Screen, Tag } from '../components/ui';
import { EstadoConexao } from '../components/conexao';
import { CartaoCampanha } from '../components/campanhas';
import { useDados, type Campanha } from '../servicos/api';
import { categorias } from '../data/formatacao';
import { UFS } from '../servicos/soma2';

export function DescobertaAvancada(){
  const router=useRouter();
  const [busca,setBusca]=useState(''),[categoria,setCategoria]=useState('Todas'),[uf,setUf]=useState('Brasil'),[urgencia,setUrgencia]=useState('Todas'),[ordem,setOrdem]=useState('Equilibrada'),[min,setMin]=useState(''),[max,setMax]=useState(''),[prazo,setPrazo]=useState('Todos');
  const params=new URLSearchParams();
  if(busca.trim())params.set('busca',busca.trim());if(categoria!=='Todas')params.set('categoria',categoria);if(uf!=='Brasil')params.set('uf',uf);
  if(urgencia!=='Todas')params.set('urgencia',urgencia==='Crítica revisada'?'critica':urgencia==='Moderada revisada'?'moderada':'regular');
  params.set('ordem',ordem==='Recentes'?'recentes':ordem==='Pouca visibilidade'?'pouca-visibilidade':ordem==='Perto da meta'?'conclusao':'equilibrada');
  if(/^\d+$/.test(min))params.set('min',String(Number(min)*100));if(/^\d+$/.test(max))params.set('max',String(Number(max)*100));if(prazo!=='Todos')params.set('prazo',prazo==='Até 7 dias'?'7':'30');
  const consulta=useDados<Campanha[]>('/descoberta?'+params.toString());
  const filtroInvalido = (min!==''&&!/^\d+$/.test(min)) || (max!==''&&!/^\d+$/.test(max)) || (min!==''&&max!==''&&Number(min)>Number(max));
  function limpar(){setBusca('');setCategoria('Todas');setUf('Brasil');setUrgencia('Todas');setOrdem('Equilibrada');setMin('');setMax('');setPrazo('Todos');}
  return <Screen title="Descobrir causas" heading="Toda causa merece ser encontrada.">
    <Field label="Buscar por título ou história" value={busca} onChangeText={setBusca}/><Choices label="Urgência" options={['Todas','Crítica revisada','Moderada revisada','Regular']} selected={urgencia} onSelect={setUrgencia}/><Choices label="Organização" options={['Equilibrada','Recentes','Pouca visibilidade','Perto da meta']} selected={ordem} onSelect={setOrdem}/>
    <Copy muted>A ordem equilibrada alterna urgências críticas revisadas, campanhas recentes e causas com pouca visibilidade. Popularidade não determina urgência.</Copy>
    <Choices label="Categoria" options={['Todas',...categorias]} selected={categoria} onSelect={setCategoria}/><Choices label="Estado autorizado" options={['Brasil',...UFS]} selected={uf} onSelect={setUf}/>
    <Field label="Meta mínima em reais inteiros (opcional)" numeric value={min} onChangeText={setMin}/><Field label="Meta máxima em reais inteiros (opcional)" numeric value={max} onChangeText={setMax}/><Choices label="Prazo de urgência revisado" options={['Todos','Até 7 dias','Até 30 dias']} selected={prazo} onSelect={setPrazo}/>
    <Button secondary title="Limpar todos os filtros" onPress={limpar}/><Button secondary title="Ver no Mapa Solidário" onPress={()=>router.push('/mapa')}/>
    {filtroInvalido ? <Notice error>Use valores inteiros em reais, com a meta mínima menor ou igual à máxima.</Notice> : null}
    <EstadoConexao {...consulta}/>{consulta.dados?<Heading>{consulta.dados.length} causas encontradas</Heading>:null}
    {consulta.dados?.map(c=><CartaoCampanha key={c.id} campanha={c} aoAbrir={()=>router.push({pathname:'/campanha',params:{id:c.id}})}/>)}
    {consulta.dados?.length===0?<EmptyState title="Vamos abrir outro caminho?" action="Limpar filtros" onPress={limpar}>Nenhuma campanha combina com esta seleção.</EmptyState>:null}
    <Tag>Localização somente com consentimento</Tag>
  </Screen>;
}
