// HTTP permitido apenas no APK de teste que acessa o servidor da rede local.
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === 'grupo') {
    const api = new URL(process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost');
    if (api.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(api.hostname) || api.hostname.endsWith('.supabase.co')) {
      throw new Error('O APK do grupo exige EXPO_PUBLIC_URL_BACKEND com a URL HTTPS pública da API Node, não do banco.');
    }
  }
  return ({
  ...config,
  plugins: (config.plugins || []).map(plugin =>
    plugin === 'expo-build-properties'
      ? ['expo-build-properties', { android: { usesCleartextTraffic: process.env.EAS_BUILD_PROFILE === 'preview' } }]
      : plugin
  ),
});
};
