const path = require('path')

const appRootDir = path.dirname(require.main.filename)

const gameConfig = require('./game')

const isGameExist = (req, res, next) => {
  if (!req.app.locals.games[req.params.id]) return res.redirect('/games')
  next()
}

module.exports = {
  appRootDir,
  gameConfig,
  isGameExist,
}
