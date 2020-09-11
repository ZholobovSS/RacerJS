const express = require('express')

const router = express.Router()

const gamesController = require('../controllers/games')

router.get('', gamesController.all)
router.get(':id', gamesController.current)

module.exports = router
