const express = require('express')
const router = express.Router()

router.get('/week', (req, res) => {
  res.end('Week route')
})

module.exports = router
