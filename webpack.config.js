const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');


const NODE_ENV = process.env.NODE_ENV || 'development';
const dev = NODE_ENV === 'development';


module.exports = {
  mode: NODE_ENV,
  watch: dev,
  watchOptions: { aggregateTimeout: 400 },
  devtool: '(none)',

  devServer: {
    contentBase: `${__dirname}/public`,
    compress: true,
    port: 9009,
  },

  entry: { yokobot: `${__dirname}/src/browser.js` },

  output: {
    path: `${__dirname}/public`,
    publicPath: '/',
    filename: dev
      ? './[name].js'
      : './[name].[hash].min.js',
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: ['babel-loader', 'eslint-loader'],
    }],
  },

  plugins: [
    new CleanWebpackPlugin(),

    dev
      ? () => {}
      : new TerserPlugin({
        parallel: true,
        terserOptions: { ecma: 6 },
      }),

    new HtmlWebpackPlugin({}),
  ],
};
