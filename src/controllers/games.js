const gameConfig = require('../config/game')

const all = (req, res) => {
  const gamesIDs = Object.keys(req.app.locals.games)
  const games = gamesIDs.map((gameID) => ({
    ...req.app.locals.games[gameID],
    full: Object.keys(req.app.locals.games[gameID].players).length === req.app.locals.games[gameID].maxPlayers,
    id: gameID,
    players: Object.keys(req.app.locals.games[gameID].players),
  }))

  res.render('games', { games })
}

const current = (req, res) => {
  const { id } = req.params

  const currentGame = req.app.locals.games[id]

  if (currentGame.maxPlayers === Object.keys(currentGame.players).length
  || currentGame.started) {
    return res.redirect('/games')
  }
  return res.render('game', {
    gameConfig: {
      ...gameConfig,
      trackLength: gameConfig.trackLength - 1,
    },
    gameID: id,
    players: Object.keys(req.app.locals.games[id].players).map((userID) => ({
      ...req.app.locals.users[userID],
      id: userID,
      ready: req.app.locals.games[id].players[userID].ready,
    })),
  })
}

module.exports = {
  all,
  current,
}
