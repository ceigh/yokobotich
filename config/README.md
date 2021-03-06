Configuration
=============

To set up your bot you need to define some variables in these config files:

**`auth.json` - bot's authorization, don't push it to repo**

  - `name` - your bot's username on twitch (any case)

  - `streamer` - channel on which bot were work (any case)

  - `token` - oauth twitch token to your bot's account, you can use [this](https://twitchapps.com/tmi/)

  - `secret` - secret string to access to bot from browser

  - `se` - streamelements account data, defines for streamer streamelements account, if you want to take points from using command, jwt and id [here](https://streamelements.com/dashboard/account/channels)

  - `dj` - twitchdj account data, define if you want to autoskip videos on [TwitchDj](https://twitch-dj.ru)

    - `id` is five-digit number, you can get it from [https://twitch-dj.ru/dashboard/{your id}](https://twitch-dj.ru/dashboard)

    - `key` is api key from settings, don't forget to tick "Access from API" checkbox.

**`opts.json` - bot's configuration**

  - `skip` - integer number of how many messages below needed to call comand

  - `rgxp` - object with regular expressions to fire commands
  
    - `set` - catch set skip value message

    - `skip` - catch skip message
  
  - `cost` - how many points command cost

**`phrases.json` - define your bot's answers here**
  - `onSkip` - messages when skip event works
  
    - `starts` - the pick of start message

    - `mids` - bodys of message

    - `ends` - the ends of messages, adds randomly

    - `beforeMsg` - funny word or phrase, that randomly added to any message
  
  - `onSet` - message when somebody (mods or broadcaster) set skip value amount, *don't forget `%d` in your template, it replace automatically with new amount of skip value*

  - `onNoPoints` - message when user have enough points to execute command, *don't forget `%s` in your template, it replace automatically to user, who execute command*

  - `emoji` - smile, which adds to end of every skip message
