import { useRouter } from 'expo-router';
import { Button, Card, Copy, EmptyState, Screen } from '../components/ui';
import { EstadoConexao, PedirLogin } from '../components/conexao';
import { useDados, usuarioLogado, type Campanha } from '../servicos/api';
export function MinhasRotas() {
  const router = useRouter(); const pessoa = usuarioLogado(); const consulta = useDados<Campanha[]>(pessoa ? '/campanhas?minhas=1' : null);
  return <Screen title="Minhas rotas" heading="Sua causa tem um caminho." back={false}><Copy>Escolha uma campanha para acompanhar cada conquista até a meta.</Copy>{!pessoa ? <PedirLogin/> : <><EstadoConexao {...consulta}/>{consulta.dados?.map(c => <Card key={c.id} title={c.titulo} subtitle={!['ativa', 'encerrada'].includes(c.estado) ? 'Em planejamento · ainda não está pública' : c.estado === 'encerrada' ? 'Campanha encerrada · histórico preservado' : 'Veja seu próximo objetivo'} icon="navigate-outline"><Button title="Explorar minha rota" onPress={() => router.push({ pathname: '/rota-inteligente', params: { id: c.id } })}/><Button secondary title="Cuidar da campanha" onPress={() => router.push({ pathname: '/gerenciar', params: { id: c.id } })}/></Card>)}{consulta.dados?.length === 0 ? <EmptyState title="Seu primeiro passo começa aqui." action="Criar uma campanha" onPress={() => router.push('/criar')}>Quando criar sua campanha, sua rota aparece neste espaço.</EmptyState> : null}</>}</Screen>;
}
