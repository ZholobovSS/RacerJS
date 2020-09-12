import { ws, addExtraTextForInput, isLogin } from './lib.js'

function registration() {
  isLogin()
  const form = document.forms.registration

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = {
      nick: form.elements.nick.value.trim(),
      skin: form.elements.skin.value,
    }

    if (Object.values(formData).every((el) => el)) {
      ws.send(JSON.stringify({ type: 'newUser', payload: formData }))
    }
  })

  ws.addEventListener('message', (message) => {
    const parseData = JSON.parse(message.data)

    switch (parseData.type) {
      case 'newUser':
        if (parseData.payload.status === 'OK') {
          localStorage.setItem('user', JSON.stringify(parseData.payload.user))
          window.location.href = '/games'
        } else if (parseData.payload.status === 'BAD') {
          addExtraTextForInput(form.elements.nick, parseData.payload.message)
        } else {
          form.reset()
        }
        break
      default:
        break
    }
  })
}

export {
  registration,
}
