// Requires
require('dotenv').config();
const tmi = require('tmi.js');
const phrases = require('./phrases');


// Variables
const bot = process.env.BOT;
if (!bot) throw Error('Define BOT env variable');
const channel = process.env.CHANNEL;
if (!channel) throw new Error('Define CHANNEL env variable');
const twitchToken = process.env.TWITCH_TOKEN;
if (!twitchToken) throw new Error('Define TWITCH_TOKEN env variable');
const twitchClientId = process.env.TWITCH_CLIENT_ID;
if (!twitchClientId) console.warn('If you want to use auto skip value '
  + 'define TWITCH_CLIENT_ID env variable');
const streamElementsJwt = process.env.STREAMELEMENTS_JWT_TOKEN;
const streamElementsAid = process.env.STREAMELEMENTS_ACCOUNT_ID;
if (!streamElementsAid || !streamElementsJwt) console.warn('If you want '
  + 'to spend points by command define STREAMELEMENTS_JWT_TOKEN env variable');

let total = 0;
const cost = 100;
const data = {
  skip: 4,
  curr: 0,
  usrs: []
};

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
    password: twitchToken
  },
  channels: [channel]
};
const client = new tmi.client(options);


// Executions
if (require.main === module) {
  client.on('chat', (chl, usr, msg) => {
    console.info(data);
    checkSetSkip(chl, usr, msg);
    checkSkipMsg(chl, usr, msg);
    updateTotal();
  });

  setSkipByViewers();
  client.connect();
}


// Functions
function updateTotal() {
  total++;
  if (total === 100) {
    setSkipByViewers();
    total = 0;
  }
}

function setSkipByViewers() {
  if (twitchClientId) {
    client.api({
      url: `https://api.twitch.tv/kraken/streams/${channel}?client_id=${twitchClientId}`
    }, (e, r, b) => {
      if (b.stream) {
        const newVal = Math.round(b.stream.viewers / 25);
        data.skip = newVal;
        console.log(`Set new skip amount to: ${newVal}`);
      } else if (e) console.warn(e);
    });
  }
}

function checkSetSkip(chl, usr, msg) {
  if (usr.mod || (usr.badges && usr.badges.broadcaster)) {
    const match = msg.match(/^!говно (\d+)$/);
    if (match) {
      const val = +match[1];
      data.skip = val;
      client.action(chl, `решил, что для пропуска теперь нужно ${val} "ну и говно" :O`);
    }
  }
}

function checkSkipMsg(chl, usr, msg) {
  const rxp = /^([нНH][уУyY] ?[иИ&] ?[гГ][оОаА04oOaA][вВB][нНH][oOоО0]|[nN][uUyYуУ] ?[iIl1&] ?[gG][oOaA04оОаА][vV][nN][oO0оО]).*/;

  if (rxp.test(msg)) {
    if (!data.usrs.includes(usr.username)) {
      client.api({
        url: `https://api.streamelements.com/kappa/v2/points/${streamElementsAid}/${usr.username}`
      }, (e, r, b) => {
        if (e) {
          console.warn(e);
        } else {
          if (b.points < cost) {
            client.action(chl, `установил, что у @${usr['display-name']} недостаточно ББП :D`);
            data.curr = 0;
            data.usrs = [];
          } else {
            data.curr++;
            data.usrs.push(usr.username);
            
            if (data.curr === data.skip) {
              client.action(chl, phrases.getPhrase(channel));
              data.curr = 0
              addPoints(data.usrs, -cost);
              data.usrs = [];
            }
          }
        }
      });
    }
  } else {
    data.curr = 0;
    data.usrs = [];
  }
}

function addPoints(usrs, points) {
  if (streamElementsJwt && streamElementsAid) {
    usrs.forEach(u => {
      client.api({
        url: `https://api.streamelements.com/kappa/v2/points/${streamElementsAid}/${u}/${points}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${streamElementsJwt}`
        },
      }, (e, r, b) => e ? console.warn(e) : console.log(b.message))
    });
  }
}

