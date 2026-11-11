import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export type Usuario = { id: number; nome: string; email: string; telefone: string; regiao: string; novidades: boolean; administrador: boolean; perfil_completo?:boolean };
export type Necessidade = { id: string; campanha_id: string; responsavel_id?: number; nome: string; tipo: 'objeto' | 'tarefa' | 'dinheiro'; meta: number; recebido: number; reservado: number; tipo_meta: string; prioridade: string; prazo: string; descricao: string; campanha: string; regiao: string; instrucoes: string; campanha_estado: string };
export type Campanha = { id: string; usuario_id: number; titulo: string; descricao: string; categoria: string; regiao: string; prazo: string; instrucoes: string; evento: string; estado: string; motivo: string; responsavel: string; necessidades: Necessidade[]; criada_em?:string; arrecadado_financeiro?:number; perfil_publico?:boolean; uf?: string; municipio?: string; imagem_id?: string | null; urgencia?: { classe: string; revisada: boolean }; visualizacoes?: number; meta_financeira?: number; recebido_financeiro?: number; submetida?: boolean };
export type Ajuda = { id: number; usuario_id: number; campanha_id: string; necessidade_id: string; tipo: string; quantidade: number; recebido: number; necessidade: string; campanha: string; pessoa: string; estado: string; entrega: string; horario: string; instrucoes: string; observacao: string; telefone_responsavel?: string };
export type Pagamento = { id: number; necessidade_id: string; campanha: string; necessidade: string; valor: number; taxa_soma: number; taxa_provedor: number; valor_liquido: number; meio: string; estado: string };
export type Repasse = { id: number; campanha_id: string; campanha: string; valor: number; finalidade: string; estado: string; motivo: string };
export type Saldo = { campanha: string; confirmado: number; reservado: number; repassado: number; disponivel: number; repasses: Repasse[] };
export type Atualizacao = { id: number; titulo: string; relato: string; autor: string; criada_em: string };
export type Atividade = { ajudas: Ajuda[]; campanhas: Campanha[]; pagamentos: Pagamento[] };
export type Aviso = { destino?: string; id: number; mensagem: string; lido: boolean; criado_em: string };
export type Denuncia = { id: number; campanha_id: string; campanha: string; motivo: string; relato: string; estado: string };
export type Administracao = { campanhas: Campanha[]; denuncias: Denuncia[]; repasses: Repasse[]; pagamentos: Pagamento[] };

// No Expo Go em rede local, o host do Metro também pode hospedar a API.
// Em APK independente, informe explicitamente uma URL HTTPS acessível.
const hostExpo = __DEV__ ? Constants.expoConfig?.hostUri?.split(':')[0] : undefined;
const ipLocal = hostExpo && /^(10\.\d+\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+$/.test(hostExpo) ? hostExpo : '';
const enderecoPadrao = Platform.OS === 'web' && typeof window !== 'undefined' ? (['8081', '8082'].includes(window.location.port) ? `${window.location.protocol}//${window.location.hostname}:3001/api` : `${window.location.origin}/api`) : ipLocal ? `http://${ipLocal}:3001/api` : '';
const enderecoApi = process.env.EXPO_PUBLIC_URL_BACKEND || enderecoPadrao;
export function urlApi() { return enderecoApi; }
let tokenAtual = '';
let pessoaAtual: Usuario | null = null;
let escritaSessao = Promise.resolve();
const ouvintes=new Set<()=>void>();
const avisar=()=>ouvintes.forEach(f=>f());
export function useSessao(){return useSyncExternalStore(f=>{ouvintes.add(f);return()=>ouvintes.delete(f);},()=>pessoaAtual,()=>null);}
export async function recuperarSessaoNativa() {
  if(Platform.OS==='web') {
    let legado='';
    try{legado=JSON.parse(window.sessionStorage.getItem('soma_sessao')||'null')?.token||'';}catch{}
    const controller=new AbortController(),limite=setTimeout(()=>controller.abort(),10000);
    try{const r=await fetch(enderecoApi+'/sessao',{signal:controller.signal,credentials:'include',headers:legado?{Authorization:'Bearer '+legado}:{}});if(!r.ok){limparSessao();return;}pessoaAtual=await r.json();tokenAtual='';try{window.sessionStorage.removeItem('soma_sessao');}catch{}avisar();}catch{pessoaAtual=null;avisar();}finally{clearTimeout(limite);}
    return;
  }
  try {const salva=JSON.parse(await SecureStore.getItemAsync('soma_sessao')||'null');tokenAtual=salva?.token||'';pessoaAtual=salva?.usuario||null;} catch {tokenAtual='';pessoaAtual=null;}
  avisar();
}
export function usuarioLogado(){return pessoaAtual;}
export function guardarSessao(token:string,usuario:Usuario){
  tokenAtual=Platform.OS==='web'?'':token;pessoaAtual=usuario;
  if(Platform.OS!=='web')escritaSessao=escritaSessao.then(()=>SecureStore.setItemAsync('soma_sessao',JSON.stringify({token,usuario}))).catch(()=>{});
  avisar();
}
export function atualizarUsuario(usuario:Usuario){guardarSessao(tokenAtual,{...pessoaAtual,...usuario});}
export function limparSessao(){
  tokenAtual='';pessoaAtual=null;
  if(Platform.OS!=='web')escritaSessao=escritaSessao.then(()=>SecureStore.deleteItemAsync('soma_sessao')).catch(()=>{});
  else if(typeof window!=='undefined'){try{window.sessionStorage.removeItem('soma_sessao');window.localStorage.removeItem('soma_sessao');}catch{}}
  avisar();
}

// This is an operation identifier, not an authentication secret.
export function criarChaveOperacao() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2); }
export async function requisitar<T>(caminho: string, metodo = 'GET', dados?: unknown, chave?: string): Promise<T> {
  if (!enderecoApi) throw new Error('Servidor não configurado. Configure o endereço da API para usar o SOMA neste celular.');
  const corpo = dados !== undefined ? JSON.stringify(dados) : undefined;
  let resumo = 2166136261;
  for (const letra of metodo + caminho + (corpo || '')) resumo = Math.imul(resumo ^ letra.charCodeAt(0), 16777619);
  const chaveEnvio = chave ? chave + '-' + (resumo >>> 0).toString(16) : '';
  let resposta: Response;
  try {
    resposta = await fetch(`${enderecoApi}${caminho}`, { method: metodo, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}), ...(chaveEnvio ? { 'Idempotency-Key': chaveEnvio } : {}) }, ...(corpo !== undefined ? { body: corpo } : {}) });
  } catch { throw new Error('Não foi possível conectar. Confira sua conexão e tente novamente.'); }
  let resultado;
  try { resultado = await resposta.json(); } catch { throw new Error('Não foi possível ler a resposta. Tente novamente em instantes.'); }
  if (!resposta.ok) {
    if (resposta.status === 401) limparSessao();
    throw new Error(resultado.mensagem || 'Não foi possível concluir a operação.');
  }
  if(metodo!=='GET' && /^\/(pagamentos|administracao\/receitas)(\/|$)/.test(caminho))avisarDadosAtualizados();
  return resultado as T;
}


let revisaoDados=0;
const ouvintesDados=new Set<()=>void>();
function observarDados(f:()=>void){ouvintesDados.add(f);return()=>{ouvintesDados.delete(f);};}
export function avisarDadosAtualizados(){revisaoDados++;ouvintesDados.forEach(f=>f());}
export function useDados<T>(caminho: string | null, atualizacaoContinua=false) {
 const emFoco=useIsFocused();
 const revisao=useSyncExternalStore(observarDados,()=>atualizacaoContinua?revisaoDados:0,()=>0);
 const [dados,definirDados]=useState<T|null>(null),[erro,definirErro]=useState(''),[carregando,definirCarregando]=useState(true),[versao,definirVersao]=useState(0);
 const ultimo=useRef(caminho),primeiro=useRef(true);
 useEffect(()=>{
  if(!emFoco)return;
  let ativo=true;let timer:ReturnType<typeof setTimeout>|undefined;
  if(ultimo.current!==caminho){ultimo.current=caminho;primeiro.current=true;definirDados(null);}
  if(!caminho){definirCarregando(false);return;}
  const endpoint=caminho;
  const visivel=()=>AppState.currentState!=='background'&&AppState.currentState!=='inactive'&&(typeof document==='undefined'||!document.hidden);
  function agendar(){if(ativo&&atualizacaoContinua)timer=setTimeout(()=>{if(visivel())void carregar();else agendar();},15000);}
  async function carregar(){
   if(primeiro.current)definirCarregando(true);
   try{const resultado=await requisitar<T>(endpoint);if(ativo){definirDados(resultado);definirErro('');}}
   catch(e){if(ativo)definirErro(mensagemErro(e));}
   finally{if(ativo){primeiro.current=false;definirCarregando(false);agendar();}}
  }
  void carregar();
  const voltar=()=>{if(visivel())definirVersao(v=>v+1);};
  const sub=atualizacaoContinua?AppState.addEventListener('change',estado=>{if(estado==='active')voltar();}):undefined;
  if(atualizacaoContinua&&typeof document!=='undefined')document.addEventListener('visibilitychange',voltar);
  return()=>{ativo=false;if(timer)clearTimeout(timer);sub?.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',voltar);};
 },[caminho,emFoco,versao,revisao,atualizacaoContinua]);
 return {dados,erro,carregando,atualizar:()=>definirVersao(v=>v+1)};
}

export function mensagemErro(problema: unknown) { return problema instanceof Error ? problema.message : 'Não foi possível concluir a operação.'; }
