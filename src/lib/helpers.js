// Imports
const jsEnv = require('browser-or-node');


// Vars
const seApiUrl = 'https://api.streamelements.com/kappa/v2';


// Funcs
const define = (item) => `Define ${item} in cfg`;

const apiOrFetch = (client) => {
  if (jsEnv.isNode) return;

  client.api = (opts, callback) => {
    const { url } = opts;
    delete opts.url;

    fetch(url, opts)
      .then((resp) => resp.json())
      .then((json) => callback(null, null, json))
      .catch((err) => callback(err));
  };
};


// Exports
module.exports = {
  seApiUrl,

  define,
  apiOrFetch,
};
