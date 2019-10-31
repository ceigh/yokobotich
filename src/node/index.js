#!/usr/bin/env node

// Imports
require('dotenv').config();
const Tmi = require('tmi.js').client;
const Yokobot = require('../lib/yokobot.js');


// Vars
const yokobot = new Yokobot(process.env);
const client = new Tmi(yokobot.opts);


// Exec
if (require.main === module) {
  client.on('chat', (channel, usr, msg) => {
    yokobot.checkSet(client, channel, usr, msg);
    yokobot.checkSkip(client, channel, usr, msg)
      .then((state) => { if (state.curr > 0) console.info(state); })
      .catch((e) => console.error(e));
  });

  client.connect();
}
