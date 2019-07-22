// Imports
require('./errors');
const phrases = require('./phrases');
const Levenshtein = require('levenshtein');
const tmi = require('tmi.js');


// Variables
const mode = process.env.NODE_ENV || 'development';
const isDev = mode === 'development';

const hoster = isDev ? 'hecig' : 'yokobovich';

const token = process.env.TWITCH_TOKEN;
if (!token) throw new AuthError('Define TWITCH_TOKEN env variable');

const options = {
  options: {
    debug: isDev
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: 'roBHo6oT',
    password: token
  },
  channels: [hoster]
};
if (isDev) console.log(options);

const client = new tmi.client(options);

const skipData = {
  toSkip: 4,
  current: 0,
  prevUser: undefined,
};


// Exec
client.on('chat', (channel, username, message) => {
  const lowercased = message.toLowerCase();
  if (isDev) console.log(username);

  if (username.username === hoster) {
    if (/^!говно/i.test(message)) {
      const splitted = message.split(' ');
      let value = splitted[1];

      if (value) {
        value = Number(value);
        if (Number.isInteger(value)) {
          skipData.toSkip = value;
          client.action(channel, `Для скипа теперь нужно ${value} нуиговен :O`);
        } else {
          client.action(channel, `${username.username}, Использование: !говно {число}`);
        }
      } else {
        client.action(channel, `${username.username}, Использование: !говно {количество}`);
      }
      return;
    }
  }

  const l = new Levenshtein('ну и говно', lowercased);
  if (isDev) console.log(`Distance: ${l.distance}`);

  if (l.distance < 4 && !lowercased.includes('не')) {
    if (skipData.prevUser !== username.username) {
      skipData.current++;
      skipData.prevUser = username.username;

      if (skipData.current === skipData.toSkip) {
        client.action(channel, phrases.getPhrase());
        skipData.current = 0;
        skipData.prevUser = undefined;
      }
    }
  } else {
    skipData.current = 0;
    skipData.prevUser = undefined;
  }

  if (isDev) console.log(skipData);
});

client.connect();
