import { Platform } from 'react-native';
import { useState } from 'react';
import { Button, Copy, Notice } from './ui';
import { requisitar, mensagemErro } from '../servicos/api';
export function GoogleLogin({ vincular = false }: { vincular?: boolean }) {
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function entrar() {
    definirOcupado(true); definirErro('');
    try { const resultado = await requisitar<{ url: string }>('/google/iniciar', 'POST', { vincular }); window.location.assign(resultado.url); }
    catch (e) { definirErro(mensagemErro(e)); definirOcupado(false); }
  }
  if (Platform.OS !== 'web') return <Copy muted>Login Google disponível na versão web após configurar o Google Cloud. Neste aplicativo, use e-mail e senha.</Copy>;
  return <><Button secondary title={vincular ? 'Vincular conta Google' : 'Continuar com Google'} disabled={ocupado} onPress={entrar}/>{erro ? <Notice error>{erro}</Notice> : null}</>;
}
