const Tmi = require('tmi.js').Client;
const Queue = require('better-queue');
const Memory = require('better-queue-memory');
const _ = require('./_');


module.exports = class YokoBot {
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
      const { channel, usr, msg } = input;
      that._checkSet(channel, usr, msg)
        .then(() => that._checkSkip(channel, usr, msg)
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
      (channel, usr, msg) => q.push({ channel, usr, msg }));

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
      this.client.action(channel, _.phrases.onSet(val));
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
        se, client, debug, streamer,
      } = this;

      if (!se.id || !se.jwt) {
        if (state.curr + 1 === state.skip) {
          const phrase = _.phrases.get(streamer);
          this._resetState();
          this.client.action(channel, phrase);
          this.client.action(channel, phrase);
          this.client.action(channel, phrase);
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
          this.client.action(channel, _.phrases.onNoPoints(usr['display-name']));
          resolve();
        } else {
          if (state.curr + 1 === state.skip) {
            const phrase = _.phrases.get(streamer);
            this._resetState();
            this.client.action(channel, phrase);
            this.client.action(channel, phrase);
            this.client.action(channel, phrase);
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
};
