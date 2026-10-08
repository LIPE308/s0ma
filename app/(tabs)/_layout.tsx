// A05, slide 17: Tabs com Ionicons, adaptadas às cinco abas do Pulso.
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, fontsReady } = useTheme(); const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 66 + Math.max(8, insets.bottom), paddingTop: 10, paddingBottom: Math.max(8, insets.bottom) }, tabBarLabelStyle: { fontSize: 11, fontFamily: fontsReady ? 'Manrope-SemiBold' : undefined } }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: ({ color }) => <Ionicons name="search-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="criar" options={{ title: 'Criar', tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="atividade" options={{ title: 'Atividade', tabBarIcon: ({ color }) => <Ionicons name="heart-outline" color={color} size={23}/> }}/>
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={23}/> }}/>
  </Tabs>;
}
