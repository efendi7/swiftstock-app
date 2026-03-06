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
            '@': './',
            '@components': './components',
            '@screens': './screens',
            '@services': './services',
            '@constants': './constants',
            '@hooks': './hooks',
            '@layouts': './layouts',
            '@assets': './assets',
          },
        },
      ],
      // Reanimated plugin harus selalu di baris terakhir jika Anda menggunakannya
      'react-native-reanimated/plugin',
    ],
  };
};