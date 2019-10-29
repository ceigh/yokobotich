#!/usr/bin/env node

require('dotenv').config();
const Tmi = require('tmi.js').client;
const Yokobot = require('./lib/yokobot.js');

const yokobot = new Yokobot(process.env);
const client = new Tmi(yokobot.opts);


if (require.main === module) {
  client.on('chat', (channel, usr, msg) => {
    yokobot.checkSet(client, channel, usr, msg);
    yokobot.checkSkip(client, channel, usr, msg);
    console.info(yokobot.state);
  });

  client.connect();
}
