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
const { appRootDir, gameConfig } = require('./src/config/index')

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

    console.log('--------------------------- parseData', parseData)

    switch (parseData.type) {
      case 'authorization':
        if (app.locals.users[parseData.payload.id]) {
          app.locals.users[parseData.payload.id].ws = ws
          ws.send(JSON.stringify({
            type: 'authorization',
            payload: {
              status: 'OK',

            },
          }))
        } else if (!app.locals.users[parseData.payload.id]
          && !Object.values(app.locals.users).find((user) => user.nick === parseData.payload.nick)) {
          app.locals.users[parseData.payload.id] = {
            nick: parseData.payload.nick,
            skin: parseData.payload.skin,
            ws,
          }
          ws.send(JSON.stringify({
            type: 'authorization',
            payload: {
              status: 'OK',

            },
          }))
        } else {
          ws.send(JSON.stringify({
            type: 'authorization',
            payload: {
              status: 'BAD',
            },
          }))
        }
        break
      case 'newUser':
        if (!Object.values(app.locals.users).find((user) => user.nick === parseData.payload.nick)) {
          const userID = uuidv4()
          app.locals.users[userID] = {
            nick: parseData.payload.nick,
            skin: parseData.payload.skin,
            ws,
          }
          ws.send(JSON.stringify({
            type: 'newUser',
            payload: {
              status: 'OK',
              user: {
                ...app.locals.users[userID],
                id: userID,
              },
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
      case 'newGame':
        if (!Object.values(app.locals.games).find((game) => game.name === parseData.payload.name)) {
          const gameID = uuidv4()
          app.locals.games[gameID] = {
            name: parseData.payload.name,
            players: {},
            maxPlayers: gameConfig.maxPlayers,
          }
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'newGame',
                payload: {
                  status: 'OK',
                  gameID,
                  name: app.locals.games[gameID].name,
                  players: Object.keys(app.locals.games[gameID].players).length,
                  maxPlayers: app.locals.games[gameID].maxPlayers,
                },
              }))
            }
          })
        } else {
          ws.send(JSON.stringify({
            type: 'newGame',
            payload: {
              status: 'BAD',
              message: 'This game name already used',
            },
          }))
        }
        break
      case 'connect': {
        console.log('connect to game', parseData.payload)
        const game = app.locals.games[parseData.payload.gameID]
        if (game && Object.keys(game.players).length + 1 <= game.maxPlayers) {
          app.locals.games[parseData.payload.gameID].players[parseData.payload.userID] = {
            id: parseData.payload.userID,
            ready: false,
            char: undefined,
          }
          ws.send(JSON.stringify({
            type: 'connect',
            payload: {
              status: 'OK',
              gameID: parseData.payload.gameID,
            },
          }))
          wss.clients.forEach((client) => {
            console.log('=============================')
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'updateGameList',
                payload: {
                  gameID: parseData.payload.gameID,
                  players: Object.keys(game.players).length,
                },
              }))
              client.send(JSON.stringify({
                type: 'newRacer',
                payload: {
                  id: parseData.payload.userID,
                  nick: app.locals.users[parseData.payload.userID].nick,
                  skin: app.locals.users[parseData.payload.userID].skin,
                  gameConfig,
                },
              }))
            }
          })
        } else {
          ws.send(JSON.stringify({
            type: 'connect',
            payload: {
              status: 'BAD',
            },
          }))
        }
      }
        break
      case 'leaveGame':
        console.log('=========== LeaveGame ===========')
        console.log(parseData)

        delete app.locals.games[parseData.payload.gameID].players[parseData.payload.userID]
        if (!Object.keys(app.locals.games[parseData.payload.gameID].players).length) {
          delete app.locals.games[parseData.payload.gameID]
        }
        wss.clients.forEach((client) => {
          if (!app.locals.games[parseData.payload.gameID]) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'removeGameFromList',
                payload: {
                  gameID: parseData.payload.gameID,
                },
              }))
            }
          } else if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'updateGameList',
              payload: {
                gameID: parseData.payload.gameID,
                players: Object.keys(app.locals.games[parseData.payload.gameID].players).length,
              },
            }))
            client.send(JSON.stringify({
              type: 'leaveGame',
              payload: {
                id: parseData.payload.userID,
              },
            }))
          }
        })

        break
      case 'playerReady': {
        console.log(parseData)
        console.log(app.locals.games)
        app.locals.games[parseData.payload.gameID].players[parseData.payload.userID].ready = true
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'playerReady',
              payload: {
                userID: parseData.payload.userID,
              },
            }))
          }
        })

        const { players } = app.locals.games[parseData.payload.gameID]

        if (Object.keys(players).length > 1
         && Object.values(players).every((player) => player.ready)) {
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          Object.keys(players).forEach((userID) => {
            const newChar = String.fromCharCode(Math.floor(Math.random() * 64 + 1040))
            console.log(newChar)
            console.log(players[userID])
            players[userID].char = newChar
            console.log(ws === players[userID].ws)
            app.locals.users[userID].ws.send(JSON.stringify({
              type: 'gameStart',
              payload: {
                char: newChar,
              },
            }))
          })
        }
      }
        break
      default:
        break
    }
    console.log(app.locals.users, app.locals.games)
    console.log('received: ', parseData)
  })

  ws.on('close', () => {
    console.log('Socket close')
  })
})

httpsServer.listen(PORT, () => {
  console.log('Server has been started on port: ', PORT)
})
