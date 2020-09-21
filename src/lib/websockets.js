const { v4: uuidv4 } = require('uuid')
const { gameConfig } = require('../config/index')

function authorizationWS(WebSocket, ws, app, parseData) {
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
}

function newUserWS(WebSocket, ws, app, parseData) {
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
}

function newGameWS(WebSocket, ws, app, parseData, wss) {
  if (!Object.values(app.locals.games).find((game) => game.name === parseData.payload.name)) {
    const gameID = uuidv4()
    app.locals.games[gameID] = {
      name: parseData.payload.name,
      players: {},
      maxPlayers: (parseData.payload.players <= gameConfig.maxPlayers) ? parseData.payload.players : gameConfig.maxPlayers,
      trackLength: gameConfig.trackLength,
      finish: [],
      started: false,
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
}

function requestForGame(WebSocket, ws, app, parseData) {
  const game = app.locals.games[parseData.payload.gameID]
  if (!game.players[parseData.payload.userID]
    && game && Object.keys(game.players).length + 1 <= game.maxPlayers
    && !game.players[parseData.payload.userID]
    && !game.started) {
    ws.send(JSON.stringify({
      type: 'connect',
      payload: {
        status: 'OK',
        gameID: parseData.payload.gameID,
        userID: parseData.payload.userID,
        nick: app.locals.users[parseData.payload.userID].nick,
        skin: app.locals.users[parseData.payload.userID].skin,
        gameConfig,
      },
    }))
  }
}

function connectGameWS(WebSocket, ws, app, parseData, wss) {
  const game = app.locals.games[parseData.payload.gameID]
  if (!game.players[parseData.payload.userID]
    && game && Object.keys(game.players).length + 1 <= game.maxPlayers
    && !game.players[parseData.payload.userID]
    && !game.started) {
    game.players[parseData.payload.userID] = {
      id: parseData.payload.userID,
      ready: false,
      char: undefined,
      position: 0,
    }
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'updateGameList',
          payload: {
            gameID: parseData.payload.gameID,
            players: Object.keys(game.players).length,
            full: Object.keys(game.players).length === game.maxPlayers,
          },
        }))
        client.send(JSON.stringify({
          type: 'newRacer',
          payload: {
            userID: parseData.payload.userID,
            nick: app.locals.users[parseData.payload.userID].nick,
            skin: app.locals.users[parseData.payload.userID].skin,
            gameConfig,
          },
        }))
      }
    })
  }
}

function leaveGameWS(WebSocket, ws, app, parseData, wss) {
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
}

function playerReadyWS(WebSocket, ws, app, parseData, wss) {
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
    app.locals.games[parseData.payload.gameID].started = true
    Object.keys(players).forEach((userID) => {
      const newChar = String.fromCharCode(Math.floor(Math.random() * 64 + 1040))
      players[userID].char = newChar
      app.locals.users[userID].ws.send(JSON.stringify({
        type: 'gameStart',
        payload: {
          char: newChar,
        },
      }))
    })
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'gameStarted',
          payload: {
            gameID: parseData.payload.gameID,
          },
        }))
      }
    })
  }
}

function newCharWS(WebSocket, ws, app, parseData) {
  const currentGame = app.locals.games[parseData.payload.gameID]
  if (currentGame.players[parseData.payload.userID].char === parseData.payload.char) {
    currentGame.players[parseData.payload.userID].position++
    let finish = false
    if (currentGame.players[parseData.payload.userID].position + 1 === currentGame.trackLength) {
      finish = true
      const finishPosition = currentGame.finish.push(parseData.payload.userID)
      Object.keys(currentGame.players).forEach((userID) => {
        app.locals.users[userID].ws.send(JSON.stringify({
          type: 'finish',
          payload: {
            userID: parseData.payload.userID,
            gameID: parseData.payload.gameID,
            position: currentGame.players[parseData.payload.userID].position,
            finishPosition,
          },
        }))
      })
    } else {
      const newChar = String.fromCharCode(Math.floor(Math.random() * 64 + 1040))
      currentGame.players[parseData.payload.userID].char = newChar
      app.locals.users[parseData.payload.userID].ws.send(JSON.stringify({
        type: 'newChar',
        payload: {
          char: newChar,
        },
      }))
    }

    if (!finish) {
      Object.keys(currentGame.players).forEach((userID) => {
        app.locals.users[userID].ws.send(JSON.stringify({
          type: 'upatePosition',
          payload: {
            userID: parseData.payload.userID,
            gameID: parseData.payload.gameID,
            position: currentGame.players[parseData.payload.userID].position,
          },
        }))
      })
    }
  }
}

module.exports = {
  authorizationWS,
  newUserWS,
  newGameWS,
  connectGameWS,
  leaveGameWS,
  playerReadyWS,
  newCharWS,
  requestForGame,
}
