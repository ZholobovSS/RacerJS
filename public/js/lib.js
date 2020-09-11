const ws = new WebSocket(window.location.origin.replace('http', 'ws'))

function addExtraTextForInput(el, html) {
  el.insertAdjacentHTML('afterend', `<small id="emailHelp" class="form-text text-danger">${html}</small>`)
}

export { ws, addExtraTextForInput }
