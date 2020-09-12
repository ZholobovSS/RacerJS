const express = require('express')

const { isGameExist } = require('../config/index')

const router = express.Router()

const gamesController = require('../controllers/games')

router.get('/:id', isGameExist, gamesController.current)
router.get('', gamesController.all)

module.exports = router
