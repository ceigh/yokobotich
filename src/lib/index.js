const Tmi = require('tmi.js').Client;
const Queue = require('better-queue');
const Memory = require('better-queue-memory');
const _ = require('./_');


module.exports = class YokoBotich {
  constructor(cfg) {
    let debug;
    try {
      debug = DEBUG;
    } catch {
      debug = true;
    }
    this.debug = debug;

    if (cfg.name) this.name = cfg.name;
    else throw Error(_.define('name', 'auth'));

    if (cfg.streamer) this.streamer = cfg.streamer;
    else throw Error(_.define('streamer', 'auth'));

    if (cfg.token) this.token = cfg.token;
    else throw Error(_.define('token', 'auth'));

    if (cfg.phrases) this.phrases = cfg.phrases;
    else throw Error('Add phrases field to your cfg (see /config/phrases.json)');

    if (cfg.dj.id && cfg.dj.key) {
      this.dj = cfg.dj;
    } else if (debug) {
      console.warn(`${_.define('dj.id and dj.key', 'auth')} to skip on TwitchDj`);
    }

    if (cfg.se.jwt && cfg.se.id) {
      this.se = cfg.se;

      if (cfg.cost) this.cost = cfg.cost;
      else {
        this.cost = 100;
        if (debug) console.warn(`${_.define('cost')} (100 by default)`);
      }
    } else if (debug) {
      console.warn(`${_.define('se.jwt and se.id', 'auth')} for points`);
    }

    this.state = {
      skip: 4,
      curr: 0,
      usrs: [],
    };
    if (cfg.skip) this.state.skip = cfg.skip;
    else if (debug) console.warn(`${_.define('skip')} (4 by default)`);

    this.rgxp = {
      set: /^!говно (\d+)$/,
      skip: new RegExp('^([нНH][уУyY] ?[иИ&] ?[гГ][оОаА04oOaA]'
        + '[вВB][нНH][oOоО0]|[nN][uUyYуУ] ?[iIl1&] ?[gG][oOaA0'
        + '4оОаА][vV][nN][oO0оО]).*'),
    };
    if (cfg.rgxp.set) this.rgxp.set = new RegExp(cfg.rgxp.set);
    else if (debug) {
      console.warn(`${_.define('custom rgxp.set')} ${
        `(${this.rgxp.set}`.substr(0, 20)}.../ by default)`);
    }
    if (cfg.rgxp.skip) this.rgxp.skip = new RegExp(cfg.rgxp.skip);
    else if (debug) {
      console.warn(`${_.define('custom rgxp.skip')} ${
        `(${this.rgxp.skip}`.substr(0, 20)}.../ by default)\n`);
    }

    this.opts = {
      options: { debug },
      connection: {
        reconnect: true,
        secure: true,
      },
      channels: [this.streamer],
      identity: {
        username: this.name,
        password: this.token,
      },
    };

    const that = this;
    const client = new Tmi(this.opts);

    const q = new Queue((input, cb) => {
      const { chat, usr, msg } = input;
      that._checkSet(chat, usr, msg)
        .then(() => that._checkSkip(chat, usr, msg)
          .finally(() => cb(null, that.state)))
        .catch(() => cb(null, that.state));
    }, { store: new Memory() });

    q.on('task_finish',
      (taskId, result, stats) => {
        const { browserCb } = this;
        if (debug) console.log(result, stats.elapsed || 0);
        if (browserCb) browserCb(result);
      });

    client.on('chat',
      (chat, usr, msg) => q.push({ chat, usr, msg }));

    _.apiOrFetch(client);
    this.client = client;
  }

  connect() {
    this.client.connect();
  }

  _resetState() {
    const { state } = this;
    state.curr = 0;
    state.usrs = [];
  }

  _checkSet(chat, usr, msg) {
    return new Promise((resolve, reject) => {
      const { badges } = usr;
      if (!(badges && badges.broadcaster) && !usr.mod) {
        resolve();
        return;
      }

      const match = msg.match(this.rgxp.set);
      if (!match) {
        resolve();
        return;
      }

      const num = +match[1];
      const val = num || 1;
      this._resetState();
      this.state.skip = val;
      this._sendPhraseOnSet(chat, val);
      reject();
    });
  }

  _checkSkip(chat, usr, msg) {
    return new Promise((resolve, reject) => {
      if (!this.rgxp.skip.test(msg)) {
        this._resetState();
        resolve();
        return;
      }

      const state = JSON.parse(JSON.stringify(this.state));
      const { username } = usr;
      if (state.usrs.includes(username)) {
        resolve();
        return;
      }

      const { se, client, debug } = this;

      if (!se.id || !se.jwt) {
        if (state.curr + 1 === state.skip) {
          this._resetState();
          this._sendPhrase(chat);
          this._skipVideo();
        } else {
          this.state.curr += 1;
          this.state.usrs.push(usr.username);
        }
        resolve();
        return;
      }

      client.api({
        url: `${_.seApiUrl}/points/${se.id}/${username}`,
      }, (e, r, b) => {
        const { cost } = this;

        if (e) {
          if (debug) throw new Error(e);
          else console.error(e);
          reject(e);
        } else if (b.points < cost) {
          this._resetState();
          this._sendPhraseOnNoPoints(chat, usr['display-name']);
          resolve();
        } else {
          if (state.curr + 1 === state.skip) {
            this._resetState();
            this._sendPhrase(chat);
            this._skipVideo();
            this._addPoints(client, [...state.usrs, username], -cost);
          } else {
            this.state.curr += 1;
            this.state.usrs.push(username);
          }
          resolve();
        }
      });
    });
  }

  _addPoints(client, usrs, pts) {
    const { se } = this;
    if (!se.id || !se.jwt) return;

    const { debug } = this;
    const url = `${_.seApiUrl}/points/${se.id}`;
    const headers = { Authorization: `Bearer ${se.jwt}` };

    usrs.forEach((u) => {
      client.api({
        url: `${url}/${u}/${pts}`,
        method: 'PUT',
        headers,
      }, (e, r, b) => {
        if (e) {
          if (debug) throw new Error(e);
          else console.error(e);
        } else if (debug) console.log(b.message);
      });
    });
  }

  _sendPhrase(chat) {
    const {
      starts, beforeWord, mids, ends,
    } = this.phrases.onSkip;

    const randStart = Math.floor(Math.random() * starts.length);
    const start = starts[randStart];

    const before = Math.round(Math.random()) ? `${beforeWord}, ` : '';

    const randMid = Math.floor(Math.random() * mids.length);
    const mid = mids[randMid];

    let end = '';
    const isEnd = Math.round(Math.random());
    if (isEnd) {
      const randEnd = Math.floor(Math.random() * ends.length);
      end = ` ${ends[randEnd]}`;
    }

    const phrase = `${start}: "${before}${mid}${end}", @${this.streamer} ${this.phrases.emoji}`;
    this.client.action(chat, phrase);
  }

  _sendPhraseOnSet(chat, val) {
    this.client.action(chat, this.phrases.onSet.replace('%d', val));
  }

  _sendPhraseOnNoPoints(chat, username) {
    this.client.action(chat, this.phrases.onNoPoints.replace('%s', `@${username}`));
  }

  _skipVideo() {
    const { debug, dj } = this;
    if (!dj) return;

    this.client.api({
      url: `https://twitch-dj.ru/api/request_skip/${dj.id}/${dj.key}`,
      headers: { 'User-Agent': 'request' },
      jsonp: { use: true, endpoint: 'callback' },
    }, (e, r, b) => {
      if (e) {
        if (debug) throw new Error(e);
        else console.error(e);
      } else if (debug) console.log(`Video ${b.success ? '' : 'not '}skipped`);
    });
  }
};
