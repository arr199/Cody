import { buildDocument } from '../preview/buildDocument'
import { createPreviewFrame } from '../preview/previewFrame'
import { debounce } from '../utils/debounce'

function element (tag, className, text = '') {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

// The Examples menu: the list of examples on the left, and on the right a
// live, scaled-down preview of the hovered or focused one. Clicking an item,
// or Load example, loads it (both carry `data-value` for createMenu).
export function renderExamplesMenu (menu, examples) {
  const list = element('div', 'example-list')
  list.append(...examples.map(({ id, title, meta }) => {
    const option = element('button', 'example-option')
    option.type = 'button'
    option.dataset.value = id
    option.append(element('span', 'example-title', title), element('span', 'example-meta', meta))
    return option
  }))

  // The preview runs the example for real, sandboxed like the main preview,
  // and is decorative: hidden from assistive tech and out of the tab order
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-scripts')
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  const stage = element('div', 'example-detail-preview')
  stage.append(frame)

  const title = element('p', 'example-detail-title')
  const text = element('p', 'example-detail-text')
  const load = element('button', 'example-load', 'Load example')
  load.type = 'button'
  const detail = element('aside', 'example-detail')
  detail.append(stage, title, text, load)
  menu.replaceChildren(list, detail)

  const preview = createPreviewFrame(frame)
  let shownId = null

  function show (id) {
    if (id === shownId) return
    shownId = id
    // Mark which item the preview belongs to
    for (const option of list.children) {
      if (option.dataset.value === id) option.setAttribute('aria-current', 'true')
      else option.removeAttribute('aria-current')
    }
    const example = examples.find(candidate => candidate.id === id)
    title.textContent = example.title
    text.textContent = example.description
    load.dataset.value = id
    preview.render(buildDocument(example))
  }

  // Sweeping the pointer down the list shouldn't render every item on the way
  const showSoon = debounce(show, 120)
  list.addEventListener('pointerover', (event) => {
    const option = event.target.closest('.example-option')
    if (option) showSoon(option.dataset.value)
  })
  list.addEventListener('focusin', (event) => {
    const option = event.target.closest('.example-option')
    if (option) show(option.dataset.value)
  })

  return {
    // Preview the first example while open; an empty preview while closed
    // stops hidden animations from running
    onToggle (open) {
      shownId = null
      if (open) show(examples[0].id)
      else preview.render('')
    }
  }
}
