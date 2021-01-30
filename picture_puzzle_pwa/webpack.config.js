const path = require('path');
const webpack = require('webpack');
// Build Feature Flags for Vue
// https://github.com/vuejs/vue-next/tree/master/packages/vue#bundler-build-feature-flags
// https://webpack.js.org/plugins/define-plugin/

new webpack.DefinePlugin({
  '__VUE_OPTIONS_API__': JSON.stringify(true),
  '__VUE_PROD_DEVTOOLS__': JSON.stringify(false)
});


module.exports = {
  mode: 'development',
  // mode: 'production',
  devtool: 'source-map',
  devServer: {
      contentBase: path.join(__dirname, 'dist'),
      host: '0.0.0.0',
      port: 3000
  }
};
