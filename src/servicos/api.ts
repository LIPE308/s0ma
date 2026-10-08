import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';

export type Usuario = { id: number; nome: string; email: string; telefone: string; regiao: string; novidades: boolean; administrador: boolean };
export type Necessidade = { id: string; campanha_id: string; nome: string; tipo: 'objeto' | 'tarefa' | 'dinheiro'; meta: number; recebido: number; reservado: number; tipo_meta: string; prioridade: string; prazo: string; descricao: string; campanha: string; regiao: string; instrucoes: string; campanha_estado: string };
export type Campanha = { id: string; usuario_id: number; titulo: string; descricao: string; categoria: string; regiao: string; prazo: string; instrucoes: string; evento: string; estado: string; motivo: string; responsavel: string; necessidades: Necessidade[] };
export type Ajuda = { id: number; usuario_id: number; campanha_id: string; necessidade_id: string; tipo: string; quantidade: number; recebido: number; necessidade: string; campanha: string; pessoa: string; estado: string; entrega: string; horario: string; instrucoes: string; observacao: string };
export type Pagamento = { id: number; necessidade_id: string; campanha: string; necessidade: string; valor: number; taxa_soma: number; taxa_provedor: number; valor_liquido: number; meio: string; estado: string };
export type Repasse = { id: number; campanha_id: string; campanha: string; valor: number; finalidade: string; estado: string; motivo: string };
export type Saldo = { campanha: string; confirmado: number; reservado: number; repassado: number; disponivel: number; repasses: Repasse[] };
export type Atualizacao = { id: number; titulo: string; relato: string; autor: string; criada_em: string };
export type Atividade = { ajudas: Ajuda[]; campanhas: Campanha[]; pagamentos: Pagamento[] };
export type Aviso = { id: number; mensagem: string; lido: boolean; criado_em: string };
export type Denuncia = { id: number; campanha_id: string; campanha: string; motivo: string; relato: string };
export type Administracao = { campanhas: Campanha[]; denuncias: Denuncia[]; repasses: Repasse[]; pagamentos: Pagamento[] };

// No navegador usa o mesmo computador. No celular configure o IP do computador.
const enderecoPadrao = Platform.OS === 'web' && typeof window !== 'undefined' ? (['8081', '8082'].includes(window.location.port) ? `${window.location.protocol}//${window.location.hostname}:3001/api` : `${window.location.origin}/api`) : 'http://localhost:3001/api';
const enderecoApi = process.env.EXPO_PUBLIC_URL_BACKEND || enderecoPadrao;
let tokenAtual = '';
let pessoaAtual: Usuario | null = null;

function recuperarSessao() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const salva = JSON.parse(window.sessionStorage.getItem('soma_sessao') || 'null');
    tokenAtual = salva?.token || ''; pessoaAtual = salva?.usuario || null;
  } catch { /* Se o navegador bloquear o armazenamento, mantém a sessão em memória. */ }
}
export function usuarioLogado() { recuperarSessao(); return pessoaAtual; }
export function guardarSessao(token: string, usuario: Usuario) {
  tokenAtual = token; pessoaAtual = usuario;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try { window.sessionStorage.setItem('soma_sessao', JSON.stringify({ token, usuario })); } catch { /* Ainda funciona em memória. */ }
  }
}
export function atualizarUsuario(usuario: Usuario) { guardarSessao(tokenAtual, usuario); }
export function limparSessao() {
  tokenAtual = ''; pessoaAtual = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') { try { window.sessionStorage.removeItem('soma_sessao'); } catch { /* Sem armazenamento disponível. */ } }
}

export async function requisitar<T>(caminho: string, metodo = 'GET', dados?: unknown): Promise<T> {
  recuperarSessao();
  let resposta: Response;
  try {
    resposta = await fetch(`${enderecoApi}${caminho}`, { method: metodo, headers: { 'Content-Type': 'application/json', ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}) }, ...(dados !== undefined ? { body: JSON.stringify(dados) } : {}) });
  } catch { throw new Error('Não foi possível acessar o servidor. Inicie o backend na porta 3001.'); }
  const resultado = await resposta.json();
  if (!resposta.ok) {
    if (resposta.status === 401) limparSessao();
    throw new Error(resultado.mensagem || 'Não foi possível concluir a operação.');
  }
  return resultado as T;
}

// useEffect + fetch: carrega novamente ao navegar ou solicitar atualização.
export function useDados<T>(caminho: string | null) {
  const pagina = usePathname();
  const [dados, definirDados] = useState<T | null>(null);
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [versao, definirVersao] = useState(0);
  useEffect(() => {
    let ativo = true;
    definirDados(null); definirErro('');
    if (!caminho) { definirCarregando(false); return; }
    definirCarregando(true);
    requisitar<T>(caminho).then(resultado => { if (ativo) definirDados(resultado); }).catch(problema => { if (ativo) definirErro(problema.message); }).finally(() => { if (ativo) definirCarregando(false); });
    return () => { ativo = false; };
  }, [caminho, pagina, versao]);
  return { dados, erro, carregando, atualizar: () => definirVersao(anterior => anterior + 1) };
}

export function mensagemErro(problema: unknown) { return problema instanceof Error ? problema.message : 'Não foi possível concluir a operação.'; }
