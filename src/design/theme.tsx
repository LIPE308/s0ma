import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export const palette = {
  light: { bg: '#FAF7F1', surface: '#FFFEFB', ink: '#272B38', muted: '#656775', primary: '#1748F5', soft: '#F3E9DB', accent: '#C45B3C', line: '#E9E0D5', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#FFFFFF', error: '#A72D34', errorBg: '#FFF0F1', success: '#175E49', successBg: '#E5F4ED', overlay: 'rgba(39,43,56,0.62)' },
  dark: { bg: '#171923', surface: '#222532', ink: '#F7F4EE', muted: '#C1BEBA', primary: '#97B5FF', soft: '#34313A', accent: '#F1A184', line: '#41414A', hero: '#1748F5', onHero: '#FFFFFF', onPrimary: '#101F48', error: '#FFBBC0', errorBg: '#44232E', success: '#A5E5CA', successBg: '#173E38', overlay: 'rgba(0,0,0,0.76)' },
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
