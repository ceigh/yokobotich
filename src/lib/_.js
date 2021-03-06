// Imports
const jsEnv = require('browser-or-node');
const SimpleCrypto = require('simple-crypto-js').default;
const jsonpCall = require('jsonp');


// Vars
const seApiUrl = 'https://api.streamelements.com/kappa/v2';


// Funcs
const getDebug = () => {
  let debug;
  const { DEBUG } = process.env;
  if (DEBUG) {
    if (DEBUG === 'false') debug = false;
    if (DEBUG === 'true') debug = true;
  } else debug = true;
  return debug;
};

const define = (item, file = 'opts') => `Define ${item} in /config/${file}.json`;

const randomString = (len) => [...Array(len)]
  .map(() => String.fromCharCode(Math.floor((Math.random() * 25) + 97)))
  .join('');

const apiOrFetch = (client) => {
  if (jsEnv.isNode) return;

  client.api = (opts, callback) => {
    let { url } = opts;
    delete opts.url;

    url = url[0] === '/' ? `https://api.twitch.tv/kraken${url}` : url;

    const { jsonp } = opts;

    if (jsonp && jsonp.use) {
      const { endpoint } = jsonp;
      const params = {};

      if (endpoint) {
        const randomName = randomString(7);
        url += `/${endpoint}/${randomName}`;
        params.name = randomName;
      }

      jsonpCall(url, params, (err, data) => callback(err, null, data));
    } else {
      fetch(url, opts)
        .then((resp) => resp.json())
        .then((json) => callback(null, null, json))
        .catch((err) => callback(err));
    }
  };
};

const hideSecret = () => {
  if (DEBUG) return;
  const { location } = window;
  window.history.pushState(null, null,
    `${location.origin}${location.pathname}`);
};

const auth = () => new Promise((resolve, reject) => {
  const secret = new URL(window.location.href).searchParams.get('secret');
  if (!secret) reject(new Error('Use /?secret url parameter'));

  const simpleCrypto = new SimpleCrypto(secret);

  const encCfg = CFG_HASH;
  let decCfg;
  try {
    decCfg = JSON.parse(simpleCrypto.decrypt(encCfg));
    hideSecret();
    resolve(decCfg);
  } catch {
    reject(new Error('Wrong secret'));
  }
});


// Exports
module.exports = {
  seApiUrl,

  define,
  getDebug,
  apiOrFetch,
  auth,
};
