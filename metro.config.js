const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Path aliases ──────────────────────────────────────────
config.resolver.extraNodeModules = {
  '@':           path.resolve(__dirname),
  '@components': path.resolve(__dirname, 'components'),
  '@screens':    path.resolve(__dirname, 'screens'),
  '@services':   path.resolve(__dirname, 'services'),
  '@constants':  path.resolve(__dirname, 'constants'),
  '@hooks':      path.resolve(__dirname, 'hooks'),
  '@layouts':    path.resolve(__dirname, 'layouts'),
  '@assets':     path.resolve(__dirname, 'assets'),
  '@navigation': path.resolve(__dirname, 'navigation'),
};

module.exports = config;