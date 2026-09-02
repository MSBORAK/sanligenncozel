module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            "@": "./src",
          }
        }
      ],
      'react-native-worklets/plugin', // Reanimated 4 — worklet'ler UI-thread'de çalışsın diye EN SONDA
    ]
  };
};
