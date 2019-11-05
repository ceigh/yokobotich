#!/usr/bin/env node

const authCfg = require('../../config/auth.json');
const optsCfg = require('../../config/opts.json');
const YokoBot = require('../lib');

const bot = new YokoBot(Object.assign(authCfg, optsCfg));
if (require.main === module) bot.connect();
