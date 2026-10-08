import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export const palette = {
  light: { bg: '#F7F9FF', surface: '#FFFFFF', ink: '#101F48', muted: '#52617D', primary: '#1748F5', soft: '#DCE7FF', accent: '#1748F5', line: '#D6DFEF', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#FFFFFF', error: '#A72D34', errorBg: '#FFF0F1', success: '#175E49', successBg: '#E5F4ED', overlay: 'rgba(16,31,72,0.6)' },
  dark: { bg: '#0B1530', surface: '#142242', ink: '#F7F9FF', muted: '#B8C6E4', primary: '#97B5FF', soft: '#22365F', accent: '#1748F5', line: '#344769', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#101F48', error: '#FFBBC0', errorBg: '#44232E', success: '#A5E5CA', successBg: '#173E38', overlay: 'rgba(0,8,26,0.75)' },
};
export type Colors = typeof palette.light;
const FontContext = createContext(false);
export function DesignProvider({ fontsReady, children }: { fontsReady: boolean; children: ReactNode }) {
  return <FontContext.Provider value={fontsReady}>{children}</FontContext.Provider>;
}
export function useDesign() {
  const dark = useColorScheme() === 'dark';
  const fontsReady = useContext(FontContext);
  return { colors: dark ? palette.dark : palette.light, dark, fontsReady };
}
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 };
export const motion = { press: 120, content: 220, introduction: 1800 };
