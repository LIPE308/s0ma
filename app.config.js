// HTTP permitido apenas no perfil local, isolado das distribuições OTA públicas.
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === 'local' && !process.env.EXPO_PUBLIC_URL_BACKEND) {
    throw new Error('Configure EXPO_PUBLIC_URL_BACKEND no perfil local com o IP da API Node desta máquina, por exemplo http://IP_DO_PC:3001/api.');
  }
  if (['grupo', 'production', 'preview', 'development'].includes(process.env.EAS_BUILD_PROFILE)) {
    const api = new URL(process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost');
    if (api.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(api.hostname) || api.hostname.endsWith('.supabase.co')) {
      throw new Error('A distribuição exige EXPO_PUBLIC_URL_BACKEND com a URL HTTPS pública da API Node, não do banco.');
    }
    if (api.username || api.password || api.search || api.hash) throw new Error('A URL pública da API não deve conter credenciais ou tokens.');
  }
  const baseUrl = process.env.SOMA_WEB_BASE || '';
  if (baseUrl && !/^\/[a-z0-9-]+$/.test(baseUrl)) throw Error('SOMA_WEB_BASE inválido');
  return ({
  ...config,
  experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  plugins: (config.plugins || []).map(plugin =>
    plugin === 'expo-build-properties'
      ? ['expo-build-properties', { android: { usesCleartextTraffic: process.env.EAS_BUILD_PROFILE === 'local' } }]
      : plugin
  ),
});
};
