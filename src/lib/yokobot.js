const Tmi = require('tmi.js').Client;
const Queue = require('better-queue');
const phrases = require('./phrases.js');
const { seApiUrl, define, apiOrFetch } = require('./helpers.js');


module.exports = class YokoBot {
  constructor(cfg) {
    const debug = cfg.DEBUG || true;
    this.debug = debug;

    if (cfg.BOT) this.bot = cfg.BOT;
    else throw Error(define('BOT'));

    if (cfg.CHANNEL) this.channel = cfg.CHANNEL;
    else throw Error(define('CHANNEL'));

    if (cfg.TOKEN) this.token = cfg.TOKEN;
    else throw Error(define('TOKEN'));

    if (cfg.STREAMELEMENTS_JWT && cfg.STREAMELEMENTS_ID) {
      this.seJwt = cfg.STREAMELEMENTS_JWT;
      this.seId = cfg.STREAMELEMENTS_ID;

      if (cfg.COST) this.cost = Math.round(+cfg.COST);
      else {
        this.cost = 100;
        if (debug) console.warn(`${define('COST')} (100 by default)`);
      }
    } else if (debug) {
      console.warn(`${define('STREAMELEMENTS_JWT '
      + 'and STREAMELEMENTS_ID')} for points`);
    }

    this.state = {
      skip: 4,
      curr: 0,
      usrs: [],
    };
    if (cfg.SKIP) this.state.skip = Math.round(+cfg.SKIP);
    else if (debug) console.warn(`${define('SKIP')} (4 by default)`);

    this.rgxp = {
      set: /^!говно (\d+)$/,
      skip: new RegExp('^([нНH][уУyY] ?[иИ&] ?[гГ][оОаА04oOaA]'
        + '[вВB][нНH][oOоО0]|[nN][uUyYуУ] ?[iIl1&] ?[gG][oOaA0'
        + '4оОаА][vV][nN][oO0оО]).*'),
    };
    if (cfg.RGXP_SET) this.rgxp.set = new RegExp(cfg.RGXP_SET);
    else if (debug) {
      console.warn(`${define('custom RGXP_SET')} ${
        `(${this.rgxp.set}`.substr(0, 20)}.../ by default)`);
    }
    if (cfg.RGXP_SKIP) this.rgxp.skip = new RegExp(cfg.RGXP_SKIP);
    else if (debug) {
      console.warn(`${define('custom RGXP_SKIP')} ${
        `(${this.rgxp.skip}`.substr(0, 20)}.../ by default)\n`);
    }

    this.opts = {
      options: { debug },
      connection: {
        reconnect: true,
        secure: true,
      },
      channels: [this.channel],
      identity: {
        username: this.bot,
        password: this.token,
      },
    };

    const that = this;
    const client = new Tmi(this.opts);

    const q = new Queue((input, cb) => {
      const { channel, usr, msg } = input;
      that._checkSet(channel, usr, msg)
        .then(() => that._checkSkip(channel, usr, msg)
          .finally(() => cb(null, that.state)))
        .catch(() => cb(null, that.state));
    });

    q.on('task_finish',
      (taskId, result, stats) => {
        if (debug) console.log(result, stats.elapsed || 0);
      });

    client.on('chat',
      (channel, usr, msg) => q.push({ channel, usr, msg }));

    apiOrFetch(client);
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

  _checkSet(channel, usr, msg) {
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
      this.client.action(channel, phrases.onSet(val));
      reject();
    });
  }

  _checkSkip(channel, usr, msg) {
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

      const {
        seId, seJwt, client, debug,
      } = this;
      const streamer = this.channel;

      if (!seId || !seJwt) {
        if (state.curr + 1 === state.skip) {
          this._resetState();
          this.client.action(channel, phrases.getPhrase(streamer));
        } else {
          this.state.curr += 1;
          this.state.usrs.push(usr.username);
        }
        resolve();
        return;
      }

      client.api({
        url: `${seApiUrl}/points/${seId}/${username}`,
      }, (e, r, b) => {
        const { cost } = this;

        if (e) {
          if (debug) throw new Error(e);
          else console.error(e);
          reject(e);
        } else if (b.points < cost) {
          this._resetState();
          this.client.action(channel, phrases.onNoPoints(usr['display-name']));
          resolve();
        } else {
          if (state.curr + 1 === state.skip) {
            this._resetState();
            this.client.action(channel, phrases.getPhrase(streamer));
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
    const { seId, seJwt } = this;
    if (!seId || !seJwt) return;

    const { debug } = this;
    const url = `${seApiUrl}/points/${seId}`;
    const headers = { Authorization: `Bearer ${seJwt}` };

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
};
