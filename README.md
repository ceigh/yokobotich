# YokoBot

Skip notification bot for twitch chat

# Install

`git clone git@gitlab.com:ceigh/yokobot.git`

# Configure

Edit `yokobot/.env` file

If you want to launch bot from browser, define SECRET variable, because
you were going to ulr like: `https://my-bot.com?secret=bunny`

These needs to decrypt your config

Edit your own bot's responses in `yokobot/src/lib/phrases.js` file

# Launch

Node:

`npm start`

Browser:

`npm run browser:dev`
