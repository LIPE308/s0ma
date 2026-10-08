import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, Field, Heading, Notice, Screen, colors, s } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { requisitar, guardarSessao, limparSessao, atualizarUsuario, usuarioLogado, useDados, mensagemErro, type Usuario, type Aviso } from '../servicos/api';

export function Login() {
  const roteador = useRouter();
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [erro, definirErro] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  async function entrar() {
    definirOcupado(true); definirErro('');
    try { const sessao = await requisitar<{ token: string; usuario: Usuario }>('/login', 'POST', { email, senha }); guardarSessao(sessao.token, sessao.usuario); roteador.replace('/'); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="soma" heading={'Sua ajuda põe tudo\nem movimento.'} subtitle="Toda ajuda conta." back={false}>
    <Field label="E-mail" email value={email} onChangeText={definirEmail} placeholder="seu@email.com"/>
    <Field label="Senha" secret value={senha} onChangeText={definirSenha} placeholder="Digite sua senha"/>
    {erro ? <Notice error>{erro}</Notice> : null}
    <Button title={ocupado ? 'Entrando...' : 'Entrar'} disabled={ocupado} onPress={entrar}/>
    <Button secondary title="Criar conta" onPress={() => roteador.push('/criar-conta')}/>
    <Button secondary title="Explorar sem entrar" onPress={() => roteador.replace('/')}/>
    <Card title="Conta para a apresentação" subtitle="ana@exemplo.com · senha: academico123"/>
    <Copy muted>As contas de exemplo são locais e próprias para o projeto acadêmico.</Copy>
  </Screen>;
}

export function SignUp() {
  const roteador = useRouter();
  const [nome, definirNome] = useState(''); const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState(''); const [confirmacao, definirConfirmacao] = useState('');
  const [aceito, definirAceito] = useState(false); const [termos, definirTermos] = useState(false);
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function cadastrar() {
    if (!aceito) { definirErro('Leia e aceite os termos do projeto.'); return; }
    if (senha !== confirmacao) { definirErro('As senhas precisam ser iguais.'); return; }
    definirOcupado(true); definirErro('');
    try {
      await requisitar('/cadastro', 'POST', { nome, email, senha });
      const sessao = await requisitar<{ token: string; usuario: Usuario }>('/login', 'POST', { email, senha });
      guardarSessao(sessao.token, sessao.usuario); roteador.replace('/acesso');
    } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen title="Criar conta" heading="Uma conta. Muitas formas." subtitle="Ajude e organize com o mesmo cadastro.">
    <Field label="Nome completo *" value={nome} onChangeText={definirNome}/><Field label="E-mail *" email value={email} onChangeText={definirEmail}/>
    <Field label="Senha *" secret value={senha} onChangeText={definirSenha} placeholder="Mínimo de 6 caracteres"/><Field label="Confirmar senha *" secret value={confirmacao} onChangeText={definirConfirmacao}/>
    <View style={s.row}><Switch accessibilityLabel="Aceito os termos" value={aceito} onValueChange={definirAceito} trackColor={{ false: colors.line, true: colors.primary }}/><Copy>Aceito os termos</Copy></View>
    <Button secondary title="Termos e privacidade" onPress={() => definirTermos(true)}/>
    {erro ? <Notice error>{erro}</Notice> : null}<Button title={ocupado ? 'Cadastrando...' : 'Criar conta'} disabled={ocupado} onPress={cadastrar}/>
    <Dialog visible={termos} title="Sobre o projeto acadêmico" onClose={() => definirTermos(false)}><Copy>Cadastro e atividades são guardados no banco local. A senha é armazenada como um resumo criptográfico. Financeiro é uma simulação; use dados de teste durante a apresentação.</Copy><Button title="Entendi" onPress={() => definirTermos(false)}/></Dialog>
  </Screen>;
}

export function Access() {
  const roteador = useRouter(); const { modo } = useLocalSearchParams<{ modo?: string }>();
  return <Screen title="Acesso" heading={modo === 'recuperar' ? 'Recuperar acesso' : 'Conta criada com sucesso.'}>
    <Notice>{modo === 'recuperar' ? 'Recuperação por e-mail não faz parte desta versão básica. Não há envio de mensagens.' : 'Seu cadastro foi salvo. Você já está conectado e pode criar campanhas e registrar ajudas.'}</Notice>
    <Button title="Continuar" onPress={() => roteador.replace('/')}/>
  </Screen>;
}

export function Profile() {
  const roteador = useRouter(); const pessoa = usuarioLogado();
  const consulta = useDados<Usuario>(pessoa ? '/perfil' : null);
  const [secao, definirSecao] = useState('Perfil');
  const [nome, definirNome] = useState(''); const [telefone, definirTelefone] = useState(''); const [regiao, definirRegiao] = useState('');
  const [mensagem, definirMensagem] = useState(''); const [ocupado, definirOcupado] = useState(false);
  useEffect(() => { if (consulta.dados) { definirNome(consulta.dados.nome); definirTelefone(consulta.dados.telefone); definirRegiao(consulta.dados.regiao); atualizarUsuario(consulta.dados); } }, [consulta.dados]);
  async function salvar() {
    definirOcupado(true);
    try { const salvo = await requisitar<Usuario>('/perfil', 'PUT', { nome, telefone, regiao }); atualizarUsuario(salvo); definirMensagem('Dados salvos.'); }
    catch (problema) { definirMensagem(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  async function sair() { try { await requisitar('/sair', 'POST'); } catch { /* A sessão local também pode ser encerrada sem conexão. */ } finally { limparSessao(); roteador.replace('/entrar'); } }
  return <Screen title="Perfil" heading="Sua conta, seus dados." subtitle={consulta.dados?.email} back={false}>
    {!pessoa ? <PedirLogin/> : <>
      <EstadoConexao {...consulta}/><Choices options={['Perfil', 'Pagamentos', 'Recebimento']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Perfil' ? <><Field label="Nome completo" value={nome} onChangeText={definirNome}/><Field label="Telefone" value={telefone} onChangeText={definirTelefone}/><Field label="Cidade e bairro" value={regiao} onChangeText={definirRegiao}/><Button title="Salvar dados" disabled={ocupado} onPress={salvar}/></> : <><Notice>Financeiro apenas para apresentação. Não coletamos CPF, cartão ou chave Pix reais.</Notice><Button secondary title="Ver minha atividade" onPress={() => roteador.push('/atividade')}/></>}
      {mensagem ? <Notice>{mensagem}</Notice> : null}
      <Card title="Avisos e preferências" icon="notifications-outline" onPress={() => roteador.push('/avisos')}/>
      {pessoa.administrador ? <Card title="Administração" icon="shield-checkmark-outline" onPress={() => roteador.push('/administracao')}/> : null}
      <Button secondary title="Sair da conta" onPress={sair}/>
    </>}
  </Screen>;
}

export function Notifications() {
  const consulta = useDados<Aviso[]>(usuarioLogado() ? '/avisos' : null);
  const [novidades, definirNovidades] = useState(usuarioLogado()?.novidades || false); const [erro, definirErro] = useState('');
  async function mudarPreferencia(valor: boolean) {
    try { const usuario = await requisitar<Usuario>('/perfil', 'PUT', { novidades: valor }); atualizarUsuario(usuario); definirNovidades(usuario.novidades); }
    catch (problema) { definirErro(mensagemErro(problema)); }
  }
  async function marcarLido(id: number) { try { await requisitar(`/avisos/${id}`, 'PATCH'); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } }
  return <Screen title="Avisos e preferências" heading="Acompanhe o que mudou.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>
      <View style={s.row}><Switch accessibilityLabel="Preferência de novidades" value={novidades} onValueChange={mudarPreferencia} trackColor={{ false: colors.line, true: colors.primary }}/><Copy>Receber novidades</Copy></View>
      <Copy muted>A preferência é salva. Esta versão não envia e-mails ou notificações push.</Copy>
      {consulta.dados?.map(aviso => <Card key={aviso.id} title={aviso.mensagem} subtitle={aviso.lido ? 'Lido' : 'Não lido'} icon="notifications-outline" onPress={() => marcarLido(aviso.id)}/>)}
      {consulta.dados?.length === 0 ? <Notice>Nenhum aviso por enquanto.</Notice> : null}
      {erro ? <Notice error>{erro}</Notice> : null}<Heading>Sobre o Soma</Heading><Copy>Uma campanha. Muitas formas de ajudar.</Copy>
    </>}
  </Screen>;
}
