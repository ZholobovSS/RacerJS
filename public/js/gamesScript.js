import { ws } from './lib.js'

function gamesScript() {
  const user = localStorage.getItem('userID')
  if (!user) window.location.href = '/'

  const form = document.forms.newgame

  form.addEventListener('submit', (e) => {
    e.preventDefault()
  })
}

export { gamesScript }
