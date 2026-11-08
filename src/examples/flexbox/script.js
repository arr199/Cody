// Every card is a flex item; clicking one reports how flexbox sized it
const cards = document.querySelector('.cards')
let columns = 0

cards.addEventListener('click', (event) => {
  const card = event.target.closest('.card')
  if (!card) return
  const inspecting = card.getAttribute('aria-pressed') !== 'true'
  card.setAttribute('aria-pressed', String(inspecting))
  if (!inspecting) return
  console.log('Inspecting', {
    property: card.dataset.property,
    value: card.dataset.value,
    width: Math.round(card.getBoundingClientRect().width) + 'px'
  })
})

// Cards in the first row share its top edge; count them to get the columns
function countColumns () {
  const tops = [...cards.children].map(item => item.offsetTop)
  return tops.filter(top => top === tops[0]).length
}

new ResizeObserver(() => {
  const count = countColumns()
  if (count === columns) return
  columns = count
  console.log('Cards now in', columns, columns === 1 ? 'column' : 'columns')
}).observe(cards)
