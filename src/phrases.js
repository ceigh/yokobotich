const phrases = [
    'заговнено.',
    'заговнили!!!',
    'скипнуто',
    'дальше давай',
    'ролик в говне',
    'обосрали такой хороший ролик, и вам не стыдно?',
    'смотрим следующий видос',
    'и зачем вы скипнули? Щас такое говно будет кошмар',
    'совесть есть скипать?',
    'наконец то это говно скипнули',
    'наговнили, уважаю',
    'боже ж ты мой, наговнили наконец',
    'слава богу сообразили заговнить этот ёбнутый бред',
    'получилось! Наконец то никто не спамил и вы заговнили',
    'а почему рот в говне?',
    '"Горите вы все в аду", подумал заказавший и обосрался, дальше',
];

const ends = [
    'нахуй',
    'блять',
    'блядь',
    'блядть',
    'едреныть',
];

const getPhrase = () => {
  const randMain = Math.floor(Math.random() * phrases.length);
  const main = phrases[randMain];

  const isEnd = Math.round(Math.random());
  const randEnd = Math.floor(Math.random() * ends.length);
  const end = isEnd ? ` ${ends[randEnd]}` : '';

  const start = Math.round(Math.random()) ? 'пиздец, ' : '';

  return `💩 💩 💩 ${start}${main}${end} 💩 💩 💩`
};

// for (let i = 0; i < 100; i++) {
//   console.log(getPhrase());
// }

exports.getPhrase = getPhrase;
