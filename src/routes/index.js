const { router } = require('../config/index')

const indexController = require('../controllers/index')

router.get('', indexController.main)

module.exports = router
