const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
      contentBase: path.join(__dirname, 'dist'),
      host: '0.0.0.0',
      port: 3000
  },
};
