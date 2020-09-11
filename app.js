require('dotenv').config()
const express = require('express')
const http = require('http')

const app = express()

const indexRouter = require('./src/routes/index')

const PORT = process.env.PORT || 80

app.use('/', indexRouter)

const httpServer = http.createServer(app)

httpServer.listen(PORT, () => {
  console.log('Server has been started on port: ', PORT)
})
