const gameConfig = require('../config/game')

const all = (req, res) => {
  const gamesIDs = Object.keys(req.app.locals.games)
  const games = gamesIDs.map((gameID) => ({
    ...req.app.locals.games[gameID],
    id: gameID,
    players: Object.keys(req.app.locals.games[gameID].players),
  }))

  console.log(games)
  res.render('games', { games })
}

const current = (req, res) => {
  const { id } = req.params

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
