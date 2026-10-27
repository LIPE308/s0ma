import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const palette = {
  light: { bg: '#FAF7F1', surface: '#FFFEFB', ink: '#272B38', muted: '#656775', primary: '#1748F5', soft: '#F3E9DB', accent: '#A7442A', line: '#E9E0D5', gentle: '#E8EFE7', gentleInk: '#345642', brandSoft: '#E9EEFF', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#FFFFFF', onPhoto: '#FFFFFF', photoScrim: 'rgba(24,25,31,0.72)', heroWash: 'rgba(255,255,255,0.16)', heroTrack: 'rgba(255,255,255,0.25)', error: '#A72D34', errorBg: '#FFF0F1', success: '#175E49', successBg: '#E5F4ED', overlay: 'rgba(39,43,56,0.62)' },
  dark: { bg: '#171923', surface: '#222532', ink: '#F7F4EE', muted: '#C1BEBA', primary: '#97B5FF', soft: '#34313A', accent: '#F1A184', line: '#41414A', gentle: '#283A30', gentleInk: '#BDDECA', brandSoft: '#293652', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#101F48', onPhoto: '#FFFFFF', photoScrim: 'rgba(24,25,31,0.72)', heroWash: 'rgba(255,255,255,0.16)', heroTrack: 'rgba(255,255,255,0.25)', error: '#FFBBC0', errorBg: '#44232E', success: '#A5E5CA', successBg: '#173E38', overlay: 'rgba(0,0,0,0.76)' },
};
export type Colors = typeof palette.light;
export type ThemePreference = 'sistema' | 'claro' | 'escuro';
export const themeStorageKey = 'soma_tema';
function validPreference(value: string | null): ThemePreference { return value === 'claro' || value === 'escuro' ? value : 'sistema'; }
function initialPreference(): ThemePreference {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'sistema';
  try { return validPreference(window.localStorage.getItem(themeStorageKey)); } catch { return 'sistema'; }
}
type Design = { colors: Colors; dark: boolean; fontsReady: boolean; temaPronto: boolean; preferencia: ThemePreference; definirTema: (value: ThemePreference) => void; erroTema: string };
const DesignContext = createContext<Design>({ colors: palette.light, dark: false, fontsReady: false, temaPronto: false, preferencia: 'sistema', definirTema: () => {}, erroTema: '' });

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
export const motion = { press: 120, content: 220, theme: 180, tab: 180, introduction: 1800 };
