// import Tmi from 'tmi.js';
import SimpleCrypto from 'simple-crypto-js';
import Yokobot from './lib/yokobot.js';


const secret = new URL(document.location.href)
  .searchParams.get('secret');
if (!secret) throw Error('Use ?secret url param');
const simpleCrypto = new SimpleCrypto(secret);

// from webpack
// eslint-disable-next-line no-undef
const encCfg = CFG_HASH;
let decCfg;
try {
  decCfg = JSON.parse(simpleCrypto.decrypt(encCfg));
} catch {
  throw new Error('Wrong secret');
}

const yokobot = new Yokobot(decCfg);
// const client = new Tmi(yokobot.opts);


// client.on('chat', (channel, usr, msg) => {
//   yokobot.checkSet(client, channel, usr, msg);
//   yokobot.checkSkip(client, channel, usr, msg);
//   console.info(yokobot.state);
//
//   client.connect();
// });

console.log(yokobot);
