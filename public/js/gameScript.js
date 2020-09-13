import {
  ws, isLogin, renderNewRacer, getUserFromLocalStorage, removeFromRace,
} from './lib.js'

function gameScript() {
  console.log('current game')

  isLogin()

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
      default:
        break
    }
  })

  window.addEventListener('beforeunload', (event) => {
    const track = document.querySelector('[data-track]')
    ws.send(JSON.stringify({
      type: 'leaveGame',
      payload: {
        userID: getUserFromLocalStorage().id,
        gameID: track.dataset.track,
      },
    }))
  })
}

export { gameScript }
