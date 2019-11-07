// Imports
const jsEnv = require('browser-or-node');
const SimpleCrypto = require('simple-crypto-js').default;
const phrases = require('../../config/phrases.json');


// Vars
const seApiUrl = 'https://api.streamelements.com/kappa/v2';


// Funcs
const getDebug = (cfg) => {
  const { DEBUG } = process.env;
  let debug;

  if (DEBUG) {
    if (DEBUG === 'false') debug = false;
    else if (DEBUG === 'true') debug = true;
  } else {
    debug = ['boolean', 'undefined'].includes(typeof cfg.debug)
      ? true : cfg.debug;
  }

  return debug;
};

const define = (item, file = 'opts') => `Define ${item} in /config/${file}.json`;

const apiOrFetch = (client) => {
  if (jsEnv.isNode) return;

  client.api = (opts, callback) => {
    let { url } = opts;
    delete opts.url;

    url = url[0] === '/' ? `https://api.twitch.tv/kraken${url}` : url;

    fetch(url, opts)
      .then((resp) => resp.json())
      .then((json) => callback(null, null, json))
      .catch((err) => callback(err));
  };
};

const auth = () => new Promise((resolve, reject) => {
  const secret = new URL(window.location.href).searchParams.get('secret');
  if (!secret) reject(new Error('No secret, use ?secret url parameter'));

  // Hide secret from url string
  if (!DEBUG) window.history.pushState(null, null, `${window.location.origin}/yokobot)`);

  const simpleCrypto = new SimpleCrypto(secret);

  const encCfg = CFG_HASH;
  let decCfg;
  try {
    decCfg = JSON.parse(simpleCrypto.decrypt(encCfg));
    resolve(decCfg);
  } catch {
    reject(new Error('Wrong secret'));
  }
});

const getPhrase = (streamer) => {
  const {
    starts, beforeWord, mids, ends,
  } = phrases.onSkip;

  const randStart = Math.floor(Math.random() * starts.length);
  const start = starts[randStart];

  const before = Math.round(Math.random()) ? `${beforeWord}, ` : '';

  const randMid = Math.floor(Math.random() * mids.length);
  const mid = mids[randMid];

  let end = '';
  const isEnd = Math.round(Math.random());
  if (isEnd) {
    const randEnd = Math.floor(Math.random() * ends.length);
    end = ` ${ends[randEnd]}`;
  }

  return `${start}: "${before}${mid}${end}", @${streamer} ${phrases.emoji}`;
};

const getPhraseOnSet = (val) => phrases.onSet.replace('%d', val);

const getPhraseOnNoPoints = (username) => phrases.onNoPoints.replace('%s', username);

const testPhrases = () => {
  for (let i = 0; i < 50; i += 1) {
    console.log(getPhrase('User'));
  }
};


// Exports
module.exports = {
  seApiUrl,

  define,
  getDebug,
  apiOrFetch,
  auth,

  phrases: {
    get: getPhrase,
    onSet: getPhraseOnSet,
    onNoPoints: getPhraseOnNoPoints,
    _test: testPhrases,
  },
};
