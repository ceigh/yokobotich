import './index.css';
import YokoBotich from '../lib';
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


auth()
  .then((cfg) => {
    bot = new YokoBotich(cfg);
    name = bot.name;
    bot.browserCb = updateUI;
    bot.connect();
    if (!DEBUG) window.onbeforeunload = () => 'Leave?';
  })
  .catch((e) => errBox.innerText = e);
