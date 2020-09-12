const gameConfig = require('../config/game')

const all = (req, res) => {
  console.log('All games')
  const { games } = req.app.locals
  console.log(games)
  res.render('games')
}

const current = (req, res) => {
  const { id } = req.params

  console.log(req.app.locals.games[id].players.map((player) => req.app.locals.users[player.id]))
  return res.render('game', {
    gameConfig: {
      ...gameConfig,
      trackLength: gameConfig.trackLength - 1,
    },
    players: req.app.locals.games[id].players.map((player) => ({ ...req.app.locals.users[player.id], id: player.id })),
  })
}

module.exports = {
  all,
  current,
}
