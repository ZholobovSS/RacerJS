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
  updatePosition,
  finish,
  connectToGame,
} from './lib.js'

function gameScript() {
  console.log('current game')

  isLogin()
  setIdReadyButton()

  const track = document.querySelector('[data-track]')
  ws.addEventListener('open', () => {
    console.log('Conect for game')
    track && connectToGame(track.dataset.track)
  })

  ws.addEventListener('message', (message) => {
    const parseData = JSON.parse(message.data)
    console.log(parseData)
    switch (parseData.type) {
      case 'connect':
        renderNewRacer(parseData.payload)
        break
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
      case 'upatePosition':
        updatePosition(parseData.payload)
        break
      case 'finish':
        if (getUserFromLocalStorage().id === parseData.payload.userID) {
          document.removeEventListener('keypress', handelKeyPress)
        }
        finish(parseData.payload)
        break
      default:
        break
    }
  })

  const readyBtn = document.querySelector('[data-ready]')
  readyBtn.addEventListener('click', readyForGame)

  window.addEventListener('beforeunload', (e) => {
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
