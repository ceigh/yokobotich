#!/usr/bin/env node

require('dotenv').config();
const tmi = require('tmi.js');
const Yokobot = require('./lib/index.js');


const yokobot = new Yokobot(process.env);
const client = new tmi.client(yokobot.opts);


if (require.main === module) {
  client.on('chat', (channel, usr, msg) => {
    console.info(yokobot.state);
    yokobot.checkSet(client, channel, usr, msg);
    yokobot.checkSkip(client, channel, usr, msg);
  });

  client.connect();
}

