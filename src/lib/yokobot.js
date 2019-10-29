// Imports
const jsEnv = require('browser-or-node');
const phrases = require('./phrases.js');

// Vars
const seApiUrl = 'https://api.streamelements.com/kappa/v2/';


// Funcs
const define = (item) => `Define ${item} in cfg`;

const changeClientApi = (client) => {
  if (jsEnv.isNode) return;

  client.api = (opts, callback) => {
    const { url } = opts;
    delete opts.url;

    fetch(url, opts)
      .then((resp) => resp.json())
      .then((json) => callback(null, null, json))
      .catch((err) => callback(err));
  };
};


// Classes
class Yokobot {
  constructor(cfg) {
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
        console.warn(`${define('COST')} (100 by default)`);
      }
    } else {
      console.warn(`${define('STREAMELEMENTS_JWT '
      + 'and STREAMELEMENTS_ID')} for points`);
    }

    this.state = {
      skip: 4,
      curr: 0,
      usrs: [],
    };
    if (cfg.SKIP) this.state.skip = Math.round(+cfg.SKIP);
    else console.warn(`${define('SKIP')} (4 by default)`);

    this.rgxp = {
      set: /^!говно (\d+)$/,
      skip: new RegExp('^([нНH][уУyY] ?[иИ&] ?[гГ][оОаА04oOaA]'
        + '[вВB][нНH][oOоО0]|[nN][uUyYуУ] ?[iIl1&] ?[gG][oOaA0'
        + '4оОаА][vV][nN][oO0оО]).*'),
    };
    if (cfg.RGXP_SET) this.rgxp.set = new RegExp(cfg.RGXP_SET);
    else {
      console.warn(`${define('custom RGXP_SET')} ${
        `(${this.rgxp.set}`.substr(0, 20)}.../ by default)`);
    }
    if (cfg.RGXP_SKIP) this.rgxp.skip = new RegExp(cfg.RGXP_SKIP);
    else {
      console.warn(`${define('custom RGXP_SKIP')} ${
        `(${this.rgxp.skip}`.substr(0, 20)}.../ by default)\n`);
    }

    this.opts = {
      options: { debug: true },
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
  }

  checkSet(client, channel, usr, msg) {
    if (usr.mod || (usr.badges && usr.badges.broadcaster)) {
      const match = msg.match(this.rgxp.set);
      if (match) {
        const val = +match[1];
        this.state.skip = val;
        client.action(channel, phrases.onSet(val));
      }
    }
  }

  checkSkip(client, channel, usr, msg) {
    changeClientApi(client);

    if (this.rgxp.skip.test(msg)) {
      if (!this.state.usrs.includes(usr.username)) {
        if (this.seId && this.seJwt) {
          client.api({
            url: `${seApiUrl}points/${this.seId}/${usr.username}`,
          }, (e, r, b) => {
            if (e) {
              console.error(e);
            } else if (b.points < this.cost) {
              client.action(channel,
                phrases.onNoPoints(usr['display-name']));
              this.state.curr = 0;
              this.state.usrs = [];
            } else {
              this.state.curr += 1;
              this.state.usrs.push(usr.username);

              if (this.state.curr === this.state.skip) {
                client.action(channel, phrases.getPhrase(this.channel));
                this.addPoints(client, this.state.usrs, -this.cost);
                this.state.curr = 0;
                this.state.usrs = [];
              }
            }
          });
        } else {
          this.state.curr += 1;
          this.state.usrs.push(usr.username);

          if (this.state.curr === this.state.skip) {
            client.action(channel, phrases.getPhrase(this.channel));
            this.state.curr = 0;
            this.state.usrs = [];
          }
        }
      }
    } else {
      this.state.curr = 0;
      this.state.usrs = [];
    }
  }

  addPoints(client, usrs, pts) {
    if (this.seJwt && this.seId) {
      usrs.forEach((u) => {
        client.api({
          url: `${seApiUrl}points/${this.seId}/${u}/${pts}`,
          method: 'PUT',
          headers: { Authorization: `Bearer ${this.seJwt}` },
        }, (e, r, b) => (e ? console.error(e) : console.log(b.message)));
      });
    }
  }
}


// Exports
module.exports = Yokobot;
