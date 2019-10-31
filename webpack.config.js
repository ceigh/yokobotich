require('dotenv').config();
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const SimpleCrypto = require('simple-crypto-js').default;


const NODE_ENV = process.env.NODE_ENV || 'development';
const dev = NODE_ENV === 'development';


const generateCfgHash = () => {
  console.info('Encoding cfg...\n');

  const secret = process.env.SECRET;
  if (!secret) throw Error('Define SECRET env variable');
  const simpleCrypto = new SimpleCrypto(secret);

  const cfg = {
    BOT: process.env.BOT,
    CHANNEL: process.env.CHANNEL,
    TOKEN: process.env.TOKEN,

    SKIP: !process.env.SKIP ? undefined
      : Math.round(Number(process.env.SKIP)),

    RGXP_SET: !process.env.RGXP_SET ? undefined
      : new RegExp(process.env.RGXP_SET),
    RGXP_SKIP: !process.env.RGXP_SKIP ? undefined
      : new RegExp(process.env.RGXP_SKIP),

    STREAMELEMENTS_ID: process.env.STREAMELEMENTS_ID,
    STREAMELEMENTS_JWT: process.env.STREAMELEMENTS_JWT,
    COST: !process.env.COST ? undefined
      : Math.round(Number(process.env.COST)),
  };

  return JSON.stringify(simpleCrypto.encrypt(cfg));
};


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

  entry: { yokobot: `${__dirname}/src/browser` },

  output: {
    path: `${__dirname}/public`,
    publicPath: '/',
    filename: dev
      ? './[name].js'
      : './[name].[hash].min.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    new DefinePlugin({
      CFG_HASH: generateCfgHash(),
    }),

    new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      title: process.env.BOT,
      favicon: './src/browser/favicon.png',
      minify: !dev,
      hash: true,
    }),

    dev
      ? () => {}
      : new TerserPlugin({
        parallel: true,
        terserOptions: { ecma: 6 },
      }),
  ],
};
