import { gamesScript } from './gamesScript.js'
import { registration } from './registration.js'

const userLocation = window.location.pathname

switch (userLocation) {
  case '/':
    registration()
    break
  case '/games':
    console.log('games')
    gamesScript()
    break
  case /games\/\d+/.test(userLocation):
    console.log('current game')
    break
  default:
    break
}
