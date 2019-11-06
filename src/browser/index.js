import './index.css';
import YokoBot from '../lib';
import { auth } from '../lib/_';


const errBox = document.querySelector('#error');
const counterBox = document.querySelector('#counter');
let bot;
let name;


const updateUI = (newState) => {
  const stateStr = `${newState.curr}/${newState.skip}`;

  counterBox.innerText = stateStr;
  document.title = `${stateStr} - ${name}`;
};


window.onbeforeunload = () => 'Leave?';

auth()
  .then((cfg) => {
    bot = new YokoBot(cfg);
    name = bot.name;
    bot.browserCb = updateUI;
    bot.connect();
  })
  .catch((e) => errBox.innerText = e);
