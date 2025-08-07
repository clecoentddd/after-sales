const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@core': path.resolve(__dirname, 'src/domain/core'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@events': path.resolve(__dirname, 'src/domain/events'),
      '@entities': path.resolve(__dirname, 'src/domain/entities'),
      '@components': path.resolve(__dirname, 'src/domain/components'),
    },
  },
};
