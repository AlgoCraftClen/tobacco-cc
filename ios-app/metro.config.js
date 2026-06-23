const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'web-streams-polyfill/ponyfill/es6': path.resolve(__dirname, 'stubs/web-streams-polyfill-es6.js'),
};

module.exports = config;
