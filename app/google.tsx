import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Notice, Screen } from '../src/components/ui';
import { guardarSessao, mensagemErro, requisitar, type Usuario } from '../src/servicos/api';
export default function RetornoGoogle() {
  const { codigo } = useLocalSearchParams<{ codigo?: string }>(); const router = useRouter(); const [erro, definirErro] = useState(''); const iniciou = useRef(false);
  useEffect(() => {
    if (!codigo || iniciou.current) return; iniciou.current = true;
    if (typeof window !== 'undefined') window.history.replaceState(null, '', '/google');
    requisitar<{ token: string; usuario: Usuario }>('/google/resgatar', 'POST', { codigo }).then(s => { guardarSessao(s.token, s.usuario); router.replace('/perfil'); }).catch(e => definirErro(mensagemErro(e)));
  }, [codigo, router]);
  return <Screen title="Login Google" heading={erro ? 'Não foi possível entrar.' : 'Conferindo sua conta…'}>{erro || !codigo ? <><Notice error>{erro || 'Abra o login Google pela tela de entrada.'}</Notice><Button title="Voltar à entrada" onPress={() => router.replace('/entrar')}/></> : <Notice>Verificando o retorno seguro do Google.</Notice>}</Screen>;
}
