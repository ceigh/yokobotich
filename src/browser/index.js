import './index.css';
import YokoBot from '../lib';
import { auth } from '../lib/_';

let bot;

auth()
  .then((cfg) => {
    bot = new YokoBot(cfg);
    bot.connect();
  }).catch((e) => console.error(e));
