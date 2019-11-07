const SimpleCrypto = require('simple-crypto-js').default;

const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { getDebug, define } = require('./src/lib/_');

const optsCfg = require('./config/opts.json');
let authCfg = require('./config/auth.json');


const debug = getDebug(optsCfg);
let cfg;


const productionCfg = () => {
  if (debug) return;

  require('dotenv').config();
  
  const { authCfgEnv } = process.env;
  if (!authCfgEnv) return;

  authCfg = JSON.parse(authCfgEnv);
};

const generateCfgHash = () => {
  console.info('Encoding cfg...\n');

  const { secret } = cfg;
  if (!secret) throw Error(define('secret', 'auth'));
  const simpleCrypto = new SimpleCrypto(secret);

  return simpleCrypto.encrypt(cfg);
};


if (!debug) productionCfg();
cfg = Object.assign(authCfg, optsCfg);

module.exports = {
  mode: debug ? 'development' : 'production',
  watch: debug,
  watchOptions: { aggregateTimeout: 400 },
  devtool: '(none)',

  devServer: {
    contentBase: `${__dirname}/public`,
    compress: true,
    port: 9009,
  },

  entry: { yokobot: `${__dirname}/src/browser` },

  output: {
    path: `${__dirname}/dist`,
    publicPath: '/',
    filename: debug
      ? './[name].js'
      : './[name].[hash].min.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: debug ? [] : ['babel-loader', 'eslint-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),

    new DefinePlugin({
      CFG_HASH: JSON.stringify(generateCfgHash()),
      DEBUG: debug,
    }),

    debug
      ? () => {}
      : new TerserPlugin({
        parallel: true,
        terserOptions: { ecma: 6 },
      }),

    new HtmlWebpackPlugin({
      template: './src/browser/index.ejs',
      favicon: './src/browser/favicon.png',
      templateParameters: {
        title: `0/${cfg.skip || 4} - ${cfg.name || 'YokoBot'}`,
        counter: `0/${cfg.skip || 4}`,
      },

      minify: !debug,
      hash: true,
    }),
  ],
};
