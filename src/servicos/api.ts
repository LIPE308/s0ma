import { useEffect, useState, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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

// No navegador usa o mesmo computador. No celular configure o IP do computador.
const enderecoPadrao = Platform.OS === 'web' && typeof window !== 'undefined' ? (['8081', '8082'].includes(window.location.port) ? `${window.location.protocol}//${window.location.hostname}:3001/api` : `${window.location.origin}/api`) : 'http://localhost:3001/api';
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
  return resultado as T;
}

// Reconsulta ao voltar à tela; abas fora de foco não fazem requisições em segundo plano.
export function useDados<T>(caminho: string | null) {
  const emFoco = useIsFocused();
  const [dados, definirDados] = useState<T | null>(null);
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [versao, definirVersao] = useState(0);
  useEffect(() => {
    if (!emFoco) return;
    let ativo = true;
    definirDados(null); definirErro('');
    if (!caminho) { definirCarregando(false); return; }
    definirCarregando(true);
    requisitar<T>(caminho).then(resultado => { if (ativo) definirDados(resultado); }).catch(problema => { if (ativo) definirErro(problema.message); }).finally(() => { if (ativo) definirCarregando(false); });
    return () => { ativo = false; };
  }, [caminho, emFoco, versao]);
  return { dados, erro, carregando, atualizar: () => definirVersao(anterior => anterior + 1) };
}

export function mensagemErro(problema: unknown) { return problema instanceof Error ? problema.message : 'Não foi possível concluir a operação.'; }
