import { createSplitter } from './splitter'

// The workspace's content box: where its grid tracks actually live
function contentBox (element) {
  const box = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  const left = Number.parseFloat(style.paddingLeft)
  const right = Number.parseFloat(style.paddingRight)
  const top = Number.parseFloat(style.paddingTop)
  const bottom = Number.parseFloat(style.paddingBottom)
  return {
    left: box.left + left,
    top: box.top + top,
    width: box.width - left - right,
    height: box.height - top - bottom
  }
}

// The two workspace handles: editor/preview split (%) and console height (px)
export function setupLayoutHandles (workspace) {
  createSplitter({
    handle: workspace.querySelector('.handle-split'),
    target: workspace,
    property: '--split',
    unit: '%',
    min: 20,
    max: 80,
    defaultValue: 50,
    storageKey: 'cody-layout-split',
    keys: { increase: 'ArrowRight', decrease: 'ArrowLeft' },
    step: 2,
    bigStep: 10,
    fromPointer: (event) => {
      const box = contentBox(workspace)
      return ((event.clientX - box.left) / box.width) * 100
    }
  })

  createSplitter({
    handle: workspace.querySelector('.handle-console'),
    target: workspace,
    property: '--console',
    unit: 'px',
    min: 80,
    max: () => contentBox(workspace).height * 0.7,
    defaultValue: 160,
    storageKey: 'cody-layout-console',
    keys: { increase: 'ArrowUp', decrease: 'ArrowDown' }, // the console grows upward
    step: 16,
    bigStep: 64,
    fromPointer: (event) => {
      const box = contentBox(workspace)
      return box.top + box.height - event.clientY
    }
  })
}
