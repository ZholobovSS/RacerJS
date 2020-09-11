const all = (req, res) => {
  console.log('All games')
  res.render('games')
}

const current = (req, res) => {
  console.log('Current game', req.params.id)
  res.render('game')
}

module.exports = {
  all,
  current,
}
