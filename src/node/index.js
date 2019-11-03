#!/usr/bin/env node

require('dotenv').config();
const YokoBot = require('../lib/yokobot.js');

const bot = new YokoBot(process.env);
if (require.main === module) bot.connect();
