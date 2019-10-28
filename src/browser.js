// const Tmi = require('tmi.js').client;
import Yokobot from './lib/yokobot.js';


const cfg = {};

const yokobot = new Yokobot(cfg);
// const client = new Tmi(yokobot.opts);


// client.on('chat', (channel, usr, msg) => {
//   yokobot.checkSet(client, channel, usr, msg);
//   yokobot.checkSkip(client, channel, usr, msg);
//   console.info(yokobot.state);
//
//   client.connect();
// });

console.log(yokobot);
