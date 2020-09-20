const ws = new WebSocket(window.location.origin.replace('http', 'ws'))

function addExtraTextForInput(el, html) {
  el.insertAdjacentHTML('afterend', `<small id="emailHelp" class="form-text text-danger">${html}</small>`)
}

function getUserFromLocalStorage() {
  const user = localStorage.getItem('user')
  if (typeof user === 'string') return JSON.parse(user)
  return user
}

function renderNewGame(game) {
  const gamesContainer = document.querySelector('[data-gamesContainer]')
  const template = `<li data-gameid="${game.gameID}" class="d-flex pointer justify-content-between list-group-item"><span>${game.name}</span><span data-playerscount>${game.players}/${game.maxPlayers}</span></li>`
  gamesContainer.insertAdjacentHTML('afterbegin', template)
}

function connectToGame(gameID) {
  ws.send(JSON.stringify({
    type: 'connect',
    payload: {
      userID: getUserFromLocalStorage().id,
      gameID,
    },
  }))
}

function requestForGame(gameID) {
  ws.send(JSON.stringify({
    type: 'requestForGame',
    payload: {
      userID: getUserFromLocalStorage().id,
      gameID,
    },
  }))
}

function gamesHandler(e) {
  const element = e.target.closest('[data-gameid]')
  if (element) {
    requestForGame(element.dataset.gameid)
  }
}

function renderNewRacer(racer) {
  const track = document.querySelector('[data-track]')
  let template = `
  <div data-player="${racer.userID}" class="path">
    <div class="section active">
      <div data-name="${racer.nick}" class="car">
        ${racer.skin}
      </div>
    </div>`
  for (let i = 0; i < racer.gameConfig.trackLength - 1; i++) {
    template += '<div class="section"></div>'
  }
  template += '</div>'
  track.insertAdjacentHTML('beforeend', template)
}

function udateGame(game) {
  const currentGame = document.querySelector(`[data-gameid="${game.gameID}"]`)
  const element = currentGame.querySelector('[data-playerscount]')
  console.log(game)
  if (element) {
    element.innerText = game.players + element.innerText.substring(1)
    if (game.full) {
      currentGame.classList.add('gameUnabled')
    } else {
      currentGame.classList.add('remove')
    }
  }
}

function removeFromRace(id) {
  return document.querySelector(`[data-player="${id}"]`).remove()
}

function removeGame(gameID) {
  document.querySelector(`[data-gameid="${gameID}"]`).remove()
}

function setIdReadyButton() {
  const user = getUserFromLocalStorage()
  const readyButton = document.querySelector('[data-ready]')
  readyButton.dataset.ready = user.id
}

function readyForGame(e) {
  ws.send(JSON.stringify({
    type: 'playerReady',
    payload: {
      userID: e.target.dataset.ready,
      gameID: e.target.closest('[data-track]').dataset.track,
    },
  }))
}

function userReady(userID) {
  document.querySelector(`[data-player="${userID}"]`).classList.add('ready')
  if (getUserFromLocalStorage().id === userID) {
    document.querySelector('[data-ready]').remove()
  }
}

function handelKeyPress(e) {
  ws.send(JSON.stringify({
    type: 'newChar',
    payload: {
      userID: getUserFromLocalStorage().id,
      gameID: document.querySelector('[data-track]').dataset.track,
      char: e.key,
    },
  }))
}

function setChar(payload) {
  const charContainer = document.querySelector('[data-char]')
  charContainer.innerText = payload.char
}

function updatePosition(payload) {
  const playerPath = document.querySelector(`[data-player="${payload.userID}"]`)
  const prev = playerPath.querySelector('.active')
  const next = playerPath.children[payload.position]
  const prevContent = prev.innerHTML
  prev.innerHTML = ''
  prev.classList.remove('active')
  next.innerHTML = prevContent
  next.classList.add('active')
}

function finish(payload) {
  updatePosition(payload)
  const playerPath = document.querySelector(`[data-player="${payload.userID}"]`)
  switch (payload.finishPosition) {
    case 1:
      playerPath.classList.add('gold')
      break
    case 2:
      playerPath.classList.add('silver')
      break
    case 3:
      playerPath.classList.add('bronze')
      break
    default:
      break
  }
  playerPath.children[0].innerHTML = payload.finishPosition
}

function gameStarted(gameID) {
  document.querySelector(`[data-gameid="${gameID}"]`).classList.add('gameStarted')
}

function isLogin() {
  const user = getUserFromLocalStorage()
  if (!user && window.location.pathname !== '/') window.location.href = '/'
  if (user) {
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'authorization', payload: user,
      }))
    })

    ws.addEventListener('message', (message) => {
      const parseData = JSON.parse(message.data)

      switch (parseData.payload.status) {
        case 'OK':
          if (window.location.pathname === '/') window.location.href = '/games'
          break
        case 'BAD':
          localStorage.removeItem('user')
          if (window.location.pathname !== '/') window.location.href = '/'
          break
        default:
          break
      }
    })
  }
}

export {
  ws,
  addExtraTextForInput,
  renderNewGame,
  gamesHandler,
  udateGame,
  isLogin,
  renderNewRacer,
  getUserFromLocalStorage,
  removeFromRace,
  removeGame,
  setIdReadyButton,
  readyForGame,
  userReady,
  handelKeyPress,
  setChar,
  updatePosition,
  finish,
  connectToGame,
  gameStarted,
}
