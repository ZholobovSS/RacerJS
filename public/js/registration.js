import { ws, addExtraTextForInput } from './lib.js'

function registration() {
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
          localStorage.setItem('userID', parseData.payload.userID)
          window.location.href = '/games'
        } else if (parseData.payload.status === 'BAD') {
          addExtraTextForInput(form.elements.nick, parseData.payload.message)
        } else {

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
