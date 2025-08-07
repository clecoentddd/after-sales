const path = require('path');
const CracoAlias = require('craco-alias');

module.exports = {
  webpack: {
    alias: {
      '@core': path.resolve(__dirname, 'src/domain/core'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@events': path.resolve(__dirname, 'src/domain/events'),
      '@entities': path.resolve(__dirname, 'src/domain/entities'),
      '@components': path.resolve(__dirname, 'src/domain/components'),
      '@features': path.resolve(__dirname, 'src/domain/features'),
    },
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: 'jsconfig',
        baseUrl: './src',
        jsConfigPath: 'jsconfig.paths.json',
      },
    },
  ],
};
