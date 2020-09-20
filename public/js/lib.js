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

function gamesHandler(e) {
  console.log(getUserFromLocalStorage().id)
  const element = e.target.closest('[data-gameid]')
  if (element) {
    ws.send(JSON.stringify({
      type: 'connect',
      payload: {
        userID: getUserFromLocalStorage().id,
        gameID: element.dataset.gameid,
      },
    }))
  }
}

function renderNewRacer(racer) {
  const track = document.querySelector('[data-track]')
  let template = `
  <div data-player="${racer.id}" class="path">
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
  const element = document.querySelector(`[data-gameid="${game.gameID}"] [data-playerscount]`)
  if (element) {
    element.innerText = game.players + element.innerText.substring(1)
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
      gameID: document.querySelector(['data-track']).dataset.track,
      char: e.key,
    },
  }))
}

function setChar(payload) {
  const charContainer = document.querySelector('[data-char]')
  charContainer.innerText = payload.char
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
}
