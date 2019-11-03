// Imports
import './index.css';
import SimpleCrypto from 'simple-crypto-js';
import YokoBot from '../lib/yokobot.js';


// Vars
const secret = new URL(window.location.href).searchParams.get('secret');
window.history.pushState(null, null, window.location.origin);
if (!secret) throw Error('Use secret url parameter');
const simpleCrypto = new SimpleCrypto(secret);

// CFG_HASH from webpack
// eslint-disable-next-line no-undef
const encCfg = CFG_HASH;
let decCfg;
try {
  decCfg = JSON.parse(simpleCrypto.decrypt(encCfg));
} catch {
  throw new Error('Wrong secret');
}

const bot = new YokoBot(decCfg);
bot.connect();
