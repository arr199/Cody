import { chevronSvg } from '../utils/svgs'
import { summarize } from '../preview/valueDescription'

// Draws a value description (src/preview/valueDescription.js) as text, or as
// an expandable tree whose children are built the first time it opens.
// Everything from the page goes in through textContent.

function el (tag, className) {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

export function renderValue (description, depth = 0) {
  const text = summarize(description, depth)
  if (!description.entries?.length) {
    const span = el('span', `value value-${description.kind}`)
    span.textContent = text
    return span
  }

  const tree = el('span', 'value value-tree')
  const toggle = el('button', 'value-toggle')
  toggle.type = 'button'
  toggle.setAttribute('aria-expanded', 'false')
  toggle.insertAdjacentHTML('afterbegin', chevronSvg)
  const summary = el('span', 'value-summary')
  summary.textContent = text
  toggle.append(summary)
  tree.append(toggle)

  let children = null
  function setOpen (open) {
    toggle.setAttribute('aria-expanded', String(open))
    if (open && !children) {
      children = renderChildren(description)
      tree.append(children)
    }
    if (children) children.hidden = !open
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  // Tree-view keys: → opens, ← closes (Enter and Space toggle, as buttons do)
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    setOpen(event.key === 'ArrowRight')
  })
  return tree
}

function renderChildren (description) {
  const group = el('div', 'value-children')
  group.setAttribute('role', 'group')
  for (const [key, child] of description.entries) {
    const line = el('div', 'value-line')
    const label = el('span', 'value-key')
    label.textContent = key + (description.kind === 'map' ? ' => ' : ': ')
    line.append(label, childValue(description, child))
    group.append(line)
  }
  if (description.more) {
    const more = el('div', 'value-more')
    more.textContent = `… ${description.more} more`
    group.append(more)
  }
  return group
}

// An opened value shows its strings in full (collapsed summaries cut them).
// An error's message and stack read best as their own lines, unquoted.
function childValue (parent, child) {
  if (child.kind !== 'string') return renderValue(child, 1)
  return plainText(parent.kind === 'error' ? child.text : JSON.stringify(child.text))
}

function plainText (text) {
  const span = el('span', 'value value-text')
  span.textContent = text
  return span
}
