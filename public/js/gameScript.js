import {
  ws,
  isLogin,
  renderNewRacer,
  getUserFromLocalStorage,
  removeFromRace,
  setIdReadyButton,
  readyForGame,
  userReady,
  handelKeyPress,
  setChar,
} from './lib.js'

function gameScript() {
  console.log('current game')

  isLogin()
  setIdReadyButton()

  ws.addEventListener('message', (message) => {
    const parseData = JSON.parse(message.data)
    console.log(parseData)
    switch (parseData.type) {
      case 'newRacer':
        renderNewRacer(parseData.payload)
        break
      case 'leaveGame':
        removeFromRace(parseData.payload.id)
        break
      case 'playerReady':
        userReady(parseData.payload.userID)
        break
      case 'gameStart':
        console.log(parseData)
        document.addEventListener('keypress', handelKeyPress)
        setChar(parseData.payload)
        break
      case 'newChar':
        setChar(parseData.payload)
        break
      default:
        break
    }
  })

  const readyBtn = document.querySelector('[data-ready]')
  readyBtn.addEventListener('click', readyForGame)

  window.addEventListener('beforeunload', (e) => {
    const track = document.querySelector('[data-track]')
    ws.send(JSON.stringify({
      type: 'leaveGame',
      payload: {
        userID: getUserFromLocalStorage().id,
        gameID: track.dataset.track,
      },
    }))
    readyBtn.removeEventListener('click', readyForGame)
    document.removeEventListener('keypress', handelKeyPress)
    console.log('leaveGame')
  })
}

export { gameScript }
