module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@':           './',
            '@components': './components',
            '@screens':    './screens',
            '@services':   './services',
            '@constants':  './constants',
            '@hooks':      './hooks',
            '@layouts':    './layouts',
            '@assets':     './assets',
            '@navigation': './navigation',
            // ⚠️ Jangan tambah '@types' — konflik dengan node_modules/@types (DefinitelyTyped)
            // Pakai '@/types/...' dan '@/utils/...' — resolved via '@': './'
          },
        },
      ],
      // Reanimated plugin harus selalu di baris terakhir
      'react-native-reanimated/plugin',
    ],
  };
};