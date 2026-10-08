import { useRouter } from 'expo-router';
import { Button, Copy, Notice } from './ui';

export function EstadoConexao({ erro, carregando }: { erro: string; carregando: boolean }) {
  return erro ? <Notice error>{erro}</Notice> : carregando ? <Copy muted>Carregando...</Copy> : null;
}
export function PedirLogin() {
  const roteador = useRouter();
  return <><Notice>Entre na sua conta para continuar.</Notice><Button title="Entrar" onPress={() => roteador.push('/entrar')}/></>;
}
