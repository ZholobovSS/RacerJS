import {
  ws, isLogin, renderNewRacer,
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
      default:
        break
    }
  })
}

export { gameScript }
