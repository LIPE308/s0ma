// A05, slide 17: Tabs com Ionicons, adaptadas às cinco abas do Pulso.
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/components/ui';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 72, paddingTop: 8, paddingBottom: 12 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: ({ color }) => <Ionicons name="search-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="criar" options={{ title: 'Criar', tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="atividade" options={{ title: 'Atividade', tabBarIcon: ({ color }) => <Ionicons name="heart-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={23}/> }}/>
  </Tabs>;
}
