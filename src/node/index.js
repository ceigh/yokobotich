#!/usr/bin/env node

const authCfg = require('../../config/auth.json');
const optsCfg = require('../../config/opts.json');
const phrases = require('../../config/phrases.json');
const YokoBot = require('../lib');

const bot = new YokoBot(Object.assign(authCfg, optsCfg, { phrases }));
if (require.main === module) bot.connect();
