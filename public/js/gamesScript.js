import {
  ws,
  addExtraTextForInput,
  renderNewGame,
  gamesHandler,
  udateGame,
  isLogin,
  removeGame,
  gameStarted,
} from './lib.js'

function gamesScript() {
  console.log('games')

  isLogin()

  const gamesContainer = document.querySelector('[data-gamesContainer]')
  gamesContainer && gamesContainer.addEventListener('click', gamesHandler)

  const form = document.forms.newgame
  const modal = document.getElementById('exampleModal')

  form && form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = {
      name: form.elements.gamename.value.trim(),
      players: +form.elements.players.value,
    }
    if (Object.values(formData).every((el) => el)) {
      ws.send(JSON.stringify({ type: 'newGame', payload: formData }))
    }
  })

  ws.addEventListener('message', (message) => {
    const parseData = JSON.parse(message.data)

    switch (parseData.type) {
      case 'newGame':
        if (parseData.payload.status === 'OK') {
          form.reset()
          renderNewGame(parseData.payload)
          $(modal).modal('hide')
        } else if (parseData.payload.status === 'BAD') {
          addExtraTextForInput(form.elements.gamename, parseData.payload.message)
        } else {
          form.reset()
          $(modal).modal('hide')
        }
        break
      case 'updateGameList':
        udateGame(parseData.payload)
        break
      case 'removeGameFromList':
        removeGame(parseData.payload.gameID)
        break
      case 'gameStarted':
        gameStarted(parseData.payload.gameID)
        break
      case 'connect':
        if (parseData.payload.status === 'OK') {
          window.location.href = `/games/${parseData.payload.gameID}`
        }
        break
      default:
        break
    }
  })
}

export { gamesScript }
