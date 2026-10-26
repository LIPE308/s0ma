import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const palette = {
  light: { bg: '#F7F9FC', surface: '#FFFFFF', ink: '#17243B', muted: '#5E6C82', primary: '#1748F5', soft: '#EDF3FF', accent: '#153A99', line: '#DDE5F0', gentle: '#EDF5F1', gentleInk: '#24735B', brandSoft: '#EDF3FF', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#FFFFFF', onPhoto: '#FFFFFF', photoScrim: 'rgba(24,25,31,0.72)', heroWash: 'rgba(255,255,255,0.16)', heroTrack: 'rgba(255,255,255,0.25)', error: '#A72D34', errorBg: '#FFF0F1', success: '#175E49', successBg: '#E5F4ED', overlay: 'rgba(39,43,56,0.62)' },
  dark: { bg: '#111B2B', surface: '#1A293E', ink: '#F7F4EE', muted: '#C1BEBA', primary: '#97B5FF', soft: '#253752', accent: '#A8C4FF', line: '#344960', gentle: '#283A30', gentleInk: '#BDDECA', brandSoft: '#293652', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#101F48', onPhoto: '#FFFFFF', photoScrim: 'rgba(24,25,31,0.72)', heroWash: 'rgba(255,255,255,0.16)', heroTrack: 'rgba(255,255,255,0.25)', error: '#FFBBC0', errorBg: '#44232E', success: '#A5E5CA', successBg: '#173E38', overlay: 'rgba(0,0,0,0.76)' },
};
export type Colors = typeof palette.light;
export type ThemePreference = 'sistema' | 'claro' | 'escuro';
export const themeStorageKey = 'soma_tema';
function validPreference(value: string | null): ThemePreference { return value === 'sistema' || value === 'escuro' ? value : 'claro'; }
function initialPreference(): ThemePreference {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'sistema';
  try { return validPreference(window.localStorage.getItem(themeStorageKey)); } catch { return 'sistema'; }
}
type Design = { colors: Colors; dark: boolean; fontsReady: boolean; temaPronto: boolean; preferencia: ThemePreference; definirTema: (value: ThemePreference) => void; erroTema: string };
const DesignContext = createContext<Design>({ colors: palette.light, dark: false, fontsReady: false, temaPronto: false, preferencia: 'sistema', definirTema: () => {}, erroTema: '' });
// Serialize native writes so quick changes cannot persist in the wrong order.
let themeWrite = Promise.resolve();
export function DesignProvider({ fontsReady, children }: { fontsReady: boolean; children: ReactNode }) {
  const system = useColorScheme();
  const [preferencia, setPreference] = useState<ThemePreference>(initialPreference);
  const [temaPronto, setReady] = useState(Platform.OS === 'web');
  const [erroTema, setError] = useState('');
  useEffect(() => {
    if (Platform.OS === 'web') {
      const sync = (event: StorageEvent) => { if (event.key === themeStorageKey) setPreference(validPreference(event.newValue)); };
      window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
    }
    let active = true;
    AsyncStorage.getItem(themeStorageKey).then(value => { if (active) setPreference(validPreference(value)); }).catch(() => { if (active) setError('Não foi possível ler a preferência de aparência.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const definirTema = useCallback((value: ThemePreference) => {
    setPreference(value); setError('');
    if (Platform.OS === 'web') {
      try { window.localStorage.setItem(themeStorageKey, value); } catch { setError('O navegador bloqueou o armazenamento. A aparência vale apenas nesta sessão.'); }
    } else {
      themeWrite = themeWrite.then(() => AsyncStorage.setItem(themeStorageKey, value)).catch(() => setError('Não foi possível guardar a aparência. Tente selecionar o tema novamente.'));
    }
  }, []);
  const dark = preferencia === 'sistema' ? system === 'dark' : preferencia === 'escuro';
  const colors = dark ? palette.dark : palette.light;
  useEffect(() => {
    if (Platform.OS === 'web') { document.documentElement.dataset.somaTheme = dark ? 'escuro' : 'claro'; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; document.body.style.backgroundColor = colors.bg; }
  }, [colors.bg, dark]);
  const design = useMemo(() => ({ colors, dark, fontsReady, temaPronto, preferencia, definirTema, erroTema }), [colors, dark, fontsReady, temaPronto, preferencia, definirTema, erroTema]);
  return <DesignContext.Provider value={design}>{children}</DesignContext.Provider>;
}
export function useDesign() { return useContext(DesignContext); }
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 };
export const radius = { control: 16, card: 22, hero: 28, pill: 99 };
export const motion = { press: 120, content: 220, theme: 180, tab: 180, introduction: 0 };
