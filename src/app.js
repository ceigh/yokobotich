#!/usr/bin/env node


require('dotenv').config();

const tmi = require('tmi.js');
const phrases = require('./phrases');


const bot = process.env.BOT;
if (!bot) throw Error('Define BOT env variable');
const channel = process.env.CHANNEL;
if (!channel) throw new Error('Define CHANNEL env variable');
const token = process.env.TOKEN;
if (!token) throw new Error('Define TOKEN env variable');

const options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: bot,
    password: token
  },
  channels: [channel]
};
const client = new tmi.client(options);

const data = {
  skip: 4,
  curr: 0,
  usrs: []
};

const clientID = process.env.CLIENT_ID;


if (clientID) {
  client.api({
    url: `https://api.twitch.tv/kraken/streams/${channel}?client_id=${clientID}`
  }, (err, res, body) => {
    if (body.stream) data.skip = Math.round(body.stream.viewers / 20);
 });
}

client.on('chat', (chl, usr, msg) => {
  // Set toSkip
  if (usr.mod || (usr.badges && usr.badges.broadcaster)) {
    const match = msg.match(/^!говно (\d+)$/);
    if (match) {
      const val = +match[1];
      data.skip = val;
      client.action(chl, `Для скипа теперь нужно ${val} нуиговен :O`);
    }
  }

  // Handle skip msgs
  const low = msg.toLowerCase();
  const rxp = /^(ну ?и ?г[aаo0о]вн[o0о]|n[uy] ?i ?g[aаo0о]vn[o0о]).*/;

  if (rxp.test(low) && !low.includes('не')) {
    if (!data.usrs.includes(usr.username)) {
      data.curr++;
      data.usrs.push(usr.username);

      if (data.curr === data.skip) {
        client.action(chl, `${phrases.getPhrase()} @${channel}`);
        data.curr = 0;
        data.usrs = [];
      }
    }
  } else {
    data.curr = 0;
    data.usrs = [];
  }

  console.info(data);
});

client.connect();
console.info(data);

