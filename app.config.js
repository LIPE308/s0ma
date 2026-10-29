// HTTP permitido apenas no APK de teste que acessa o servidor da rede local.
module.exports = ({ config }) => ({
  ...config,
  plugins: (config.plugins || []).map(plugin =>
    plugin === 'expo-build-properties'
      ? ['expo-build-properties', { android: { usesCleartextTraffic: process.env.EAS_BUILD_PROFILE === 'preview' } }]
      : plugin
  ),
});
