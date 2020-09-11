const main = (req, res) => {
  res.render('index', { mainpage: true })
}

module.exports = {
  main,
}
