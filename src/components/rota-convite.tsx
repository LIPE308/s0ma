import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Button, Copy, Heading, Progress, useTheme } from './ui';
import { EstadoConexao } from './conexao';
import { useDados } from '../servicos/api';
import { formatarDinheiro } from '../data/formatacao';
import type { Inteligencia } from '../screens/inteligencia';
type ResumoRota = Pick<Inteligencia, 'meta' | 'arrecadado' | 'percentual' | 'marcos' | 'campanha'>;
export function RotaConvite({ id, estado = 'ativa', recemCriada = false, dados, criador = false }: { id: string; estado?: string; recemCriada?: boolean; dados?: ResumoRota | null; criador?: boolean }) {
  const router = useRouter(); const { colors, s } = useTheme(); const consulta = useDados<Inteligencia>(dados === undefined ? `/campanhas/${id}/inteligencia` : null);
  const resumo = dados === undefined ? consulta.dados : dados;
  const proximo = resumo?.marcos.find(m => m.id.startsWith('financeiro') && m.id !== 'financeiro-1' && !m.concluido);
  const planejamento = !['ativa', 'encerrada'].includes(estado);
  return <View style={{ borderRadius: 24, backgroundColor: colors.brandSoft, padding: 22, gap: 14, overflow: 'hidden' }}>
    <Text style={[s.eyebrow, { color: colors.primary, marginBottom: 0 }]}>{planejamento ? 'SUA ROTA EM PLANEJAMENTO' : 'USE A ROTA INTELIGENTE'}</Text>
    <Heading>{recemCriada ? 'Sua campanha ganhou um caminho.' : 'Cada conquista aproxima sua meta.'}</Heading><Copy>Descubra seu caminho até a meta e acompanhe cada conquista.</Copy>
    <View accessible={false} style={{ height: 68, overflow: 'hidden' }}><Svg width="100%" height="68" viewBox="0 0 300 68"><Path d="M 10,66 C 150,75 30,5 180,23 S 220,10 290,6" fill="none" stroke={colors.line} strokeWidth={16}/><Path d="M 10,66 C 150,75 30,5 180,23 S 220,10 290,6" fill="none" stroke={colors.primary} strokeWidth={10}/><Path d="M 10,66 C 150,75 30,5 180,23 S 220,10 290,6" fill="none" stroke={colors.surface} strokeWidth={1.5} strokeDasharray="5 9"/></Svg></View>
    {dados === undefined ? <EstadoConexao {...consulta}/> : null}
    {resumo && resumo.meta > 0 ? <><Text style={s.label}>{formatarDinheiro(resumo.arrecadado / 100)} de {formatarDinheiro(resumo.meta / 100)} · demonstração</Text><Progress done={resumo.arrecadado} total={resumo.meta}/><Copy muted>{proximo ? `Próximo objetivo: ${proximo.titulo} · ${formatarDinheiro(proximo.valor / 100)}` : 'Sua meta financeira foi alcançada no teste.'}</Copy></> : <Copy muted>{resumo ? 'Acompanhe suas ajudas e planeje os próximos passos. Sem meta financeira cadastrada.' : 'Preparando o resumo da sua jornada…'}</Copy>}
    {planejamento ? <Copy muted>A campanha ainda não está pública. Aqui você apenas planeja sua jornada.</Copy> : null}
    <Button title={planejamento ? 'Planejar minha rota' : criador || recemCriada ? 'Explorar minha rota' : 'Explorar a rota'} onPress={() => router.push({ pathname: '/rota-inteligente', params: { id } })}/>
  </View>;
}
