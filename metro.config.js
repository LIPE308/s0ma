const { getDefaultConfig } = require('expo/metro-config');
const { dirname } = require('node:path');

const config = getDefaultConfig(__dirname);
// No Windows/OneDrive, o diretório do CLI pode ser reportado como reparse point
// pelo crawler. Incluí-lo explicitamente mantém o runtime do Expo no índice.
config.watchFolders = [...config.watchFolders, dirname(require.resolve('@expo/cli/package.json'))];
module.exports = config;
