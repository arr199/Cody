// Disclosure-style dropdowns: a toggle button controls a `hidden` container of
// option buttons, each carrying its value in `data-value`. `onToggle(open)`
// runs whenever the menu actually opens or closes.
export function createMenu (button, menu, onSelect, { onToggle } = {}) {
  function setOpen (open) {
    const changed = menu.hidden === open
    menu.hidden = !open
    button.setAttribute('aria-expanded', String(open))
    button.classList.toggle('buttons-active', open)
    if (changed) onToggle?.(open)
  }

  button.addEventListener('click', () => setOpen(menu.hidden))

  menu.addEventListener('click', (e) => {
    const option = e.target.closest('[data-value]')
    if (!option) return
    onSelect(option.dataset.value)
    setOpen(false)
    button.focus()
  })

  return {
    isOpen: () => !menu.hidden,
    contains: (node) => button.contains(node) || menu.contains(node),
    close ({ restoreFocus = false } = {}) {
      setOpen(false)
      if (restoreFocus) button.focus()
    }
  }
}

// Closes menus on a click outside them, or on Escape.
export function closeMenusOnOutsideInteraction (menus) {
  document.addEventListener('pointerdown', (e) => {
    menus.forEach(menu => {
      if (menu.isOpen() && !menu.contains(e.target)) menu.close()
    })
  })
  // Clicks inside the preview iframe never reach this document, but they do
  // move focus out of the window.
  window.addEventListener('blur', () => {
    menus.forEach(menu => menu.close())
  })
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    menus.forEach(menu => {
      if (menu.isOpen()) menu.close({ restoreFocus: true })
    })
  })
}
