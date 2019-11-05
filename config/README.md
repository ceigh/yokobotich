Configuration
=============

To set up your bot you need to define some variables in these config files:

**`auth.json` - bot's authorization, don't push it to repo**

  - `name` - your bot's username on twitch (any case)

  - `streamer` - channel on which bot were work (any case)

  - `token` - oauth twitch token to your bot's account, you can use [this](https://twitchapps.com/tmi/)

  - `secret` - secret string to access to bot from browser

  - `se` - streamelements account data, defines for streamer streamelements account, if you want to take points from using command, jwt and id [here](https://streamelements.com/dashboard/account/channels)

**`opts.json` - bot's configuration**

  - `debug` - `true`/`false`, depends on want you see console messages or not

  - `skip` - integer number of how many messages below needed to call comand

  - `rgxp` - object with regular expressions to fire commands
  
    - `set` - catch set skip value message

    - `skip` - catch skip message
  
  - `cost` - how many points command cost

**`phrases.json` - define your bot's answers here**

  - `starts` - the pick of start message

  - `mids` - bodys of message

  - `ends` - the ends of messages, adds randomly

  - `beforeMsg` - funny word or phrase, that randomly added to any message
