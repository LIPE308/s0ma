import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { Button, Card, Choices, Copy, Dialog, EmptyState, Field, Heading, Notice, Screen, useTheme } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { requisitar, guardarSessao, limparSessao, atualizarUsuario, usuarioLogado, useDados, mensagemErro, type Usuario, type Aviso, type Campanha, type Atividade } from '../servicos/api';
import { destinoAposLogin } from '../servicos/navegacao';
import type { ThemePreference } from '../design/theme';
import { CartaoCampanha } from '../components/campanhas';
import { GoogleLogin } from '../components/google-login';
import { PerfilPessoal } from '../components/perfil-pessoal';

export function Login() {
  const roteador = useRouter(); const { retorno } = useLocalSearchParams<{ retorno?: string }>();
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [erro, definirErro] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  async function entrar() {
    if (!email.trim() || !senha) { definirErro('Informe seu e-mail e sua senha.'); return; }
    definirOcupado(true); definirErro('');
    try { const sessao = await requisitar<{ token: string; usuario: Usuario }>('/login', 'POST', { email: email.trim(), senha }); guardarSessao(sessao.token, sessao.usuario); roteador.replace(sessao.usuario.administrador && !retorno ? '/administracao' : destinoAposLogin(retorno)); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="account" title="soma" heading="Bom ter você por aqui." subtitle="Entre para fazer parte das histórias da sua comunidade." back={false}>
    <Field label="E-mail" email value={email} onChangeText={definirEmail} placeholder="seu@email.com"/>
    <Field label="Senha" secret value={senha} onChangeText={definirSenha} placeholder="Digite sua senha"/>
    {erro ? <Notice error>{erro}</Notice> : null}
    <Button title={ocupado ? 'Entrando...' : 'Entrar'} disabled={ocupado} onPress={entrar}/>
    <GoogleLogin/>
    <Button secondary title="Criar conta" onPress={() => roteador.push({ pathname: '/criar-conta', params: { retorno } })}/>
    <Button secondary title="Explorar sem entrar" onPress={() => roteador.replace('/')}/>
    <Copy muted>Use sua própria conta. O acesso administrativo é configurado pela equipe responsável.</Copy>
  </Screen>;
}

export function SignUp() {
  const { s, colors } = useTheme();
  const roteador = useRouter(); const { retorno } = useLocalSearchParams<{ retorno?: string }>();
  const [nome, definirNome] = useState(''); const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState(''); const [confirmacao, definirConfirmacao] = useState('');
  const [aceito, definirAceito] = useState(false); const [termos, definirTermos] = useState(false);
  const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  async function cadastrar() {
    if (!nome.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || senha.length < 6) { definirErro('Informe seu nome, um e-mail válido e uma senha com pelo menos 6 caracteres.'); return; }
    if (!aceito) { definirErro('Leia e aceite os termos do projeto.'); return; }
    if (senha !== confirmacao) { definirErro('As senhas precisam ser iguais.'); return; }
    definirOcupado(true); definirErro('');
    try {
      await requisitar('/cadastro', 'POST', { nome: nome.trim(), email: email.trim(), senha });
      const sessao = await requisitar<{ token: string; usuario: Usuario }>('/login', 'POST', { email: email.trim(), senha });
      guardarSessao(sessao.token, sessao.usuario); roteador.replace({ pathname: '/acesso', params: { retorno } });
    } catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  return <Screen variant="form" title="Criar conta" heading="Uma conta. Muitas formas." subtitle="Ajude e organize com o mesmo cadastro.">
    <Field label="Nome completo *" value={nome} onChangeText={definirNome}/><Field label="E-mail *" email value={email} onChangeText={definirEmail}/>
    <Field label="Senha *" secret value={senha} onChangeText={definirSenha} placeholder="Mínimo de 6 caracteres"/><Field label="Confirmar senha *" secret value={confirmacao} onChangeText={definirConfirmacao}/>
    <View style={s.row}><Switch accessibilityLabel="Aceito os termos" value={aceito} onValueChange={definirAceito} trackColor={{ false: colors.line, true: colors.primary }}/><Copy>Aceito os termos</Copy></View>
    <Button secondary title="Termos e privacidade" onPress={() => definirTermos(true)}/>
    {erro ? <Notice error>{erro}</Notice> : null}<Button title={ocupado ? 'Cadastrando...' : 'Criar conta'} disabled={ocupado} onPress={cadastrar}/>
    <Dialog visible={termos} title="Sobre o projeto acadêmico" onClose={() => definirTermos(false)}><Copy>Cadastro e atividades são guardados no banco local. A senha é armazenada como um resumo criptográfico. Financeiro é uma simulação; use dados de teste durante a apresentação.</Copy><Button title="Entendi" onPress={() => definirTermos(false)}/></Dialog>
  </Screen>;
}

export function Access() {
  const roteador = useRouter(); const { modo, retorno } = useLocalSearchParams<{ modo?: string; retorno?: string }>();
  return <Screen title="Acesso" heading={modo === 'recuperar' ? 'Recuperar acesso' : 'Conta criada com sucesso.'}>
    <Notice>{modo === 'recuperar' ? 'Recuperação por e-mail não faz parte desta versão básica. Não há envio de mensagens.' : 'Seu cadastro foi salvo. Você já está conectado e pode criar campanhas e registrar ajudas.'}</Notice>
    <Button title="Continuar" onPress={() => roteador.replace(destinoAposLogin(retorno))}/>
  </Screen>;
}

export function Profile() {
  const roteador = useRouter(); const pessoa = usuarioLogado(); const { preferencia, definirTema, erroTema } = useTheme();
  const consulta = useDados<Usuario>(pessoa ? '/perfil' : null);
  const [secao, definirSecao] = useState('Campanhas');
  const campanhas = useDados<Campanha[]>(pessoa && secao === 'Campanhas' ? '/campanhas?minhas=1' : null);
  const atividade = useDados<Atividade>(pessoa && secao === 'Participações' ? '/atividade' : null);
  const [nome, definirNome] = useState(''); const [telefone, definirTelefone] = useState(''); const [regiao, definirRegiao] = useState('');
  const [mensagem, definirMensagem] = useState(''); const [erro, definirErro] = useState(''); const [ocupado, definirOcupado] = useState(false);
  const temas: Record<ThemePreference, string> = { sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' };
  useEffect(() => { if (consulta.dados) { definirNome(consulta.dados.nome); definirTelefone(consulta.dados.telefone); definirRegiao(consulta.dados.regiao); atualizarUsuario(consulta.dados); } }, [consulta.dados]);
  async function salvar() {
    if (!nome.trim()) { definirErro('Informe seu nome para salvar o perfil.'); return; }
    definirOcupado(true); definirErro(''); definirMensagem('');
    try { const salvo = await requisitar<Usuario>('/perfil', 'PUT', { nome, telefone, regiao }); atualizarUsuario(salvo); definirMensagem('Dados salvos.'); }
    catch (problema) { definirErro(mensagemErro(problema)); } finally { definirOcupado(false); }
  }
  async function sair() { try { await requisitar('/sair', 'POST'); } catch { /* A sessão local também pode ser encerrada sem conexão. */ } finally { limparSessao(); roteador.replace('/entrar'); } }
  return <Screen variant="form" title="Perfil" heading="Seu lugar na comunidade." subtitle={consulta.dados?.email} back={false}>
    {pessoa ? <PerfilPessoal/> : null}
    {!pessoa ? <PedirLogin/> : <>
      <EstadoConexao {...consulta}/><Choices options={['Campanhas', 'Participações', 'Meus dados', 'Aparência']} selected={secao} onSelect={definirSecao}/>
      {secao === 'Aparência' ? <>    <Heading>Aparência</Heading><Copy muted>Escolha o que fica melhor para você. Sistema acompanha a aparência do dispositivo.</Copy>
    <Choices options={['Sistema', 'Claro', 'Escuro']} selected={temas[preferencia]} onSelect={tema => definirTema(tema === 'Claro' ? 'claro' : tema === 'Escuro' ? 'escuro' : 'sistema')}/>
    {erroTema ? <Notice error>{erroTema}</Notice> : <Copy muted>A preferência fica salva neste dispositivo.</Copy>}
</> : secao === 'Meus dados' ? <><Field label="Nome completo" value={nome} onChangeText={definirNome}/><Field label="Telefone" value={telefone} onChangeText={definirTelefone}/><Field label="Cidade e bairro" value={regiao} onChangeText={definirRegiao}/><Button title="Salvar dados" disabled={ocupado || consulta.carregando || !!consulta.erro} onPress={salvar}/></> : secao === 'Campanhas' ? <><EstadoConexao {...campanhas}/>{campanhas.dados?.map(campanha => <CartaoCampanha key={campanha.id} campanha={campanha} cta="Organizar campanha" aoAbrir={() => roteador.push({ pathname: '/gerenciar', params: { id: campanha.id } })}/>)}{campanhas.dados?.length === 0 ? <EmptyState title="Uma causa pode começar com você." action="Criar campanha" onPress={() => roteador.push('/criar')}>Você ainda não criou uma campanha.</EmptyState> : null}</> : <><EstadoConexao {...atividade}/>{atividade.dados?.ajudas.map(ajuda => <Card key={ajuda.id} title={ajuda.necessidade} subtitle={ajuda.campanha + ' · ' + ajuda.estado} icon="heart-outline" onPress={() => roteador.push({ pathname: '/ajuda', params: { id: String(ajuda.id) } })}/>)}{atividade.dados?.ajudas.length === 0 ? <EmptyState title="Há muitas formas de somar." action="Explorar oportunidades" onPress={() => roteador.push('/explorar')}>Suas participações aparecem aqui depois de registradas.</EmptyState> : null}<Button secondary title="Ver histórico completo" onPress={() => roteador.push('/atividade')}/></>}
      {erro ? <Notice error>{erro}</Notice> : mensagem ? <Notice success>{mensagem}</Notice> : null}
      <Card title="Avisos e preferências" icon="notifications-outline" onPress={() => roteador.push('/avisos')}/>
      {pessoa.administrador ? <Card title="Administração" icon="shield-checkmark-outline" onPress={() => roteador.push('/administracao')}/> : null}
      <Button secondary title="Sair da conta" onPress={sair}/>
    </>}
  </Screen>;
}

export function Notifications() {
  const { s, colors } = useTheme();
  const consulta = useDados<Aviso[]>(usuarioLogado() ? '/avisos' : null);
  const [novidades, definirNovidades] = useState(usuarioLogado()?.novidades || false); const [erro, definirErro] = useState('');
  async function mudarPreferencia(valor: boolean) {
    try { const usuario = await requisitar<Usuario>('/perfil', 'PUT', { novidades: valor }); atualizarUsuario(usuario); definirNovidades(usuario.novidades); }
    catch (problema) { definirErro(mensagemErro(problema)); }
  }
  async function marcarLido(id: number) { try { await requisitar(`/avisos/${id}`, 'PATCH'); consulta.atualizar(); } catch (problema) { definirErro(mensagemErro(problema)); } }
  return <Screen variant="form" title="Avisos e preferências" heading="Acompanhe o que mudou.">
    {!usuarioLogado() ? <PedirLogin/> : <><EstadoConexao {...consulta}/>
      <View style={s.row}><Switch accessibilityLabel="Preferência de novidades" value={novidades} onValueChange={mudarPreferencia} trackColor={{ false: colors.line, true: colors.primary }}/><Copy>Receber novidades</Copy></View>
      <Copy muted>A preferência é salva. Esta versão não envia e-mails ou notificações push.</Copy>
      {consulta.dados?.map(aviso => <Card key={aviso.id} title={aviso.mensagem} subtitle={aviso.lido ? 'Lido' : 'Não lido'} icon="notifications-outline" onPress={() => marcarLido(aviso.id)}/>)}
      {consulta.dados?.length === 0 ? <Notice>Nenhum aviso por enquanto.</Notice> : null}
      {erro ? <Notice error>{erro}</Notice> : null}<Heading>Sobre o Soma</Heading><Copy>Uma campanha. Muitas formas de ajudar.</Copy>
    </>}
  </Screen>;
}
