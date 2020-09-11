require('dotenv').config()
const express = require('express')
const https = require('http')
const path = require('path')
const hbs = require('hbs')
const { v4: uuidv4 } = require('uuid')
const WebSocket = require('ws')

const { parse } = require('path')
const indexRouter = require('./src/routes/index')
const gamesRouter = require('./src/routes/games')
const { appRootDir } = require('./src/config/index')

const app = express()

const users = {}
const games = {}

// Configure server
app.set('view engine', 'hbs')
app.set('views', path.join(appRootDir, 'src', 'views'))
hbs.registerPartials(path.join(appRootDir, 'src', 'views', 'partials'))
app.use(express.static('public'))

const PORT = process.env.PORT || 80

app.use('/', indexRouter)
app.use('/games', gamesRouter)

const httpsServer = https.createServer(app)

const wss = new WebSocket.Server({ server: httpsServer })

wss.on('connection', (ws) => {
  console.log('User connect to socket')

  ws.on('message', (message) => {
    const parseData = JSON.parse(message)

    switch (parseData.type) {
      case 'newUser':
        if (!Object.values(users).find((user) => user.nick === parseData.payload.nick)) {
          const userID = uuidv4()
          users[userID] = {
            nick: parseData.payload.nick,
            skin: parseData.payload.skin,
          }
          ws.send(JSON.stringify({
            type: 'newUser',
            payload: {
              status: 'OK',
              userID,
            },
          }))
        } else {
          ws.send(JSON.stringify({
            type: 'newUser',
            payload: {
              status: 'BAD',
              message: 'Nick already used',
            },
          }))
        }
        break
      default:
        break
    }

    console.log(users)

    console.log('received: ', parseData)
  })

  ws.on('close', () => {
    console.log('Socket close')
  })
})

httpsServer.listen(PORT, () => {
  console.log('Server has been started on port: ', PORT)
})
