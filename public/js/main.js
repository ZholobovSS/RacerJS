import { gamesScript } from './gamesScript.js'
import { registration } from './registration.js'
import { gameScript } from './gameScript.js'

const userLocation = window.location.pathname

if (userLocation === '/') {
  registration()
} else if (/games\/?$/.test(userLocation)) {
  gamesScript()
} else if (/games\/\w+/.test(userLocation)) {
  gameScript()
}
