require('dotenv').config()
const express = require('express')
const https = require('http')
const path = require('path')
const hbs = require('hbs')
const { v4: uuidv4 } = require('uuid')
const WebSocket = require('ws')
const { parse } = require('path')
const e = require('express')
const indexRouter = require('./src/routes/index')
const gamesRouter = require('./src/routes/games')
const { appRootDir } = require('./src/config/index')
const wsLib = require('./src/lib/websockets')

const app = express()
const PORT = process.env.PORT || 80

app.locals.users = {}
app.locals.games = {}

// Configure server
app.set('view engine', 'hbs')
app.set('views', path.join(appRootDir, 'src', 'views'))
hbs.registerPartials(path.join(appRootDir, 'src', 'views', 'partials'))
app.use(express.static('public'))

hbs.registerHelper('times', (n, block) => {
  let accum = ''
  for (let i = 0; i < n; ++i) accum += block.fn(i)
  return accum
})

app.use('/', indexRouter)
app.use('/games', gamesRouter)

const httpsServer = https.createServer(app)
const wss = new WebSocket.Server({ server: httpsServer })

wss.on('connection', (ws) => {
  console.log('User connect to socket')

  ws.on('message', (message) => {
    const parseData = JSON.parse(message)

    // console.log('--------------------------- parseData', parseData)

    switch (parseData.type) {
      case 'authorization':
        wsLib.authorizationWS(WebSocket, ws, app, parseData)
        break
      case 'newUser':
        wsLib.newUserWS(WebSocket, ws, app, parseData)
        break
      case 'newGame':
        wsLib.newGameWS(WebSocket, ws, app, parseData, wss)
        break
      case 'requestForGame':
        wsLib.requestForGame(WebSocket, ws, app, parseData)
        break
      case 'connect':
        wsLib.connectGameWS(WebSocket, ws, app, parseData, wss)
        break
      case 'leaveGame':
        wsLib.leaveGameWS(WebSocket, ws, app, parseData, wss)
        break
      case 'playerReady':
        wsLib.playerReadyWS(WebSocket, ws, app, parseData, wss)
        break
      case 'newChar':
        wsLib.newCharWS(WebSocket, ws, app, parseData)
        break
      default:
        break
    }
  })

  ws.on('close', () => {
    console.log('Socket close')
  })
})

httpsServer.listen(PORT, () => {
  console.log('Server has been started on port: ', PORT)
})
