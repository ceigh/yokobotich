// Imports
import './index.css';
import '../lib/modules/tmi.min.js';
import SimpleCrypto from 'simple-crypto-js';
import jsonp from 'jsonp';
import Yokobot from '../lib/yokobot.js';


// Vars
const stateBox = document.createElement('main');
document.body.appendChild(stateBox);

const secret = new URL(window.location.href).searchParams.get('secret');
// window.history.pushState(null, null, window.location.origin);
if (!secret) {
  stateBox.innerText = 'Enter the secret';
  throw Error('Use secret url parameter');
}
const simpleCrypto = new SimpleCrypto(secret);

// CFG_HASH from webpack
// eslint-disable-next-line no-undef
const encCfg = CFG_HASH;
let decCfg;
try {
  decCfg = JSON.parse(simpleCrypto.decrypt(encCfg));
} catch {
  stateBox.innerText = 'Wrong secret';
  throw new Error('Wrong secret');
}

const Tmi = window.tmi.Client;
const yokobot = new Yokobot(decCfg);
const client = new Tmi(yokobot.opts);


// Funcs
const updateUI = () => {
  const stateStr = `${yokobot.state.curr}/${yokobot.state.skip}`;
  stateBox.innerText = stateStr;
  document.title = `${stateStr} - ${yokobot.bot}`;
};

const onChat = (channel, usr, msg) => {
  yokobot.checkSet(client, channel, usr, msg);
  yokobot.checkSkip(client, channel, usr, msg)
    .then((state) => {
      updateUI();
      if (state.curr > 0) console.info(state);
    })
    .catch((e) => console.error(e));
};


const tryToConnect = () => {
  if (client.server) {
    clearInterval(tryToConnect);
    return;
  }

  jsonp('https://tmi.twitch.tv/group/user/'
    + `${yokobot.channel.toLowerCase()}/chatters`,
  (err, res) => {
    if (err) {
      console.error(err);
      return;
    }

    const users = Object.values(res.data.chatters).flat();
    const bot = yokobot.bot.toLowerCase();

    if (!users.includes(bot)) {
      client.connect();
      updateUI();
    } else {
      const waitMsg = 'Waiting to another hoster disconnect...';
      stateBox.innerText = waitMsg;
      document.title = waitMsg;
      console.log(waitMsg);
    }
  });
};


// Exec
updateUI();
console.info('Initial state: ', yokobot.state);

client.on('chat', onChat);
tryToConnect();
setInterval(tryToConnect, 10000);
