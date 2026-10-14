// The errands are plain data; render() re-pins the board after every change
const PINS = ['#d32f2f', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a']
const TILTS = [-1, 1.5, -0.5, 1, -1.5]
let nextId = 1
const errands = ['Pick up dry cleaning', 'Oat milk', 'Return library books', 'Birthday card for Sam']
  .map((text, index) => ({ id: nextId++, text, done: index === 0 }))

const list = document.querySelector('.cards')
const form = document.querySelector('.new')

function renderCard (errand) {
  const card = document.createElement('li')
  card.className = errand.done ? 'card done' : 'card'
  card.dataset.id = errand.id
  // Pin colour and tilt come from the id, so a card keeps them across renders
  card.style.setProperty('--pin', PINS[errand.id % PINS.length])
  card.style.setProperty('--r', TILTS[errand.id % TILTS.length])

  const label = document.createElement('label')
  const box = document.createElement('input')
  box.type = 'checkbox'
  box.checked = errand.done
  const text = document.createElement('span')
  text.className = 'text'
  text.textContent = errand.text
  label.append(box, text)

  const unpin = document.createElement('button')
  unpin.type = 'button'
  unpin.className = 'unpin'
  unpin.textContent = 'Unpin'
  unpin.setAttribute('aria-label', `Unpin ${errand.text}`)

  card.append(label, unpin)
  return card
}

function render (focusId) {
  list.replaceChildren(...errands.map(renderCard))
  // Re-rendering replaces the checkbox, so hand keyboard focus back to it
  list.querySelector(`[data-id="${focusId}"] input`)?.focus()
}

function errandFor (element) {
  const id = Number(element.closest('.card').dataset.id)
  return errands.find(errand => errand.id === id)
}

// One listener on the list handles every card (event delegation)
list.addEventListener('change', (event) => {
  const errand = errandFor(event.target)
  errand.done = event.target.checked
  console.log(errand.done ? 'Stamped done' : 'Un-stamped', errand)
  render(errand.id)
})

list.addEventListener('click', (event) => {
  if (!event.target.matches('.unpin')) return
  const errand = errandFor(event.target)
  errands.splice(errands.indexOf(errand), 1)
  console.log('Unpinned', errand)
  render()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = form.errand.value.trim()
  if (!text) return
  const errand = { id: nextId++, text, done: false }
  errands.push(errand)
  console.log('Pinned', errand)
  form.reset()
  render()
})

render()
console.log('Board ready', { cards: errands.length })
