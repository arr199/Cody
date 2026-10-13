// Switches the editors grid between layouts. Which panels each layout shows is
// decided in style.css.
const VIEWS = ['front-end-view', 'playground-view']

export function setupViews (container, buttons) {
  for (const [view, button] of Object.entries(buttons)) {
    button.addEventListener('click', () => {
      container.classList.remove(...VIEWS)
      container.classList.add(view)
    })
  }
}
