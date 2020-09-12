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

function isLogin() {
  const user = getUserFromLocalStorage()
  if (!user && window.location.pathname !== '/') window.location.href = '/'
  else if (user && window.location.pathname === '/') window.location.href = '/games'
}

export {
  ws,
  addExtraTextForInput,
  renderNewGame,
  gamesHandler,
  udateGame,
  isLogin,
  renderNewRacer,
}
