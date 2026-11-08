import { createSplitter } from '../ui/splitter'

// Device presets, a free-drag width handle with a live px readout, and
// fullscreen for the preview pane. Width null means "full": the stylesheet's
// 100% applies and follows the pane.
export function setupDeviceToolbar ({ pane, stage, frame, presets, readout, frameHandle, fullscreenButton }) {
  const presetButtons = [...presets.querySelectorAll('[data-width]')]
  const presetWidth = (button) => (button.dataset.width === 'full' ? null : Number(button.dataset.width))

  // The width asked for (a preset, or the last dragged value). A preset can
  // be wider than the pane; the frame then renders narrower, and says so.
  let requested = null
  const actualWidth = () => Math.round(frame.getBoundingClientRect().width)
  const isClamped = () => requested !== null && actualWidth() < requested

  function showWidth () {
    // A frame as wide as the stage keeps its handle inside, where it can be grabbed
    frame.toggleAttribute('data-fills', actualWidth() >= stage.clientWidth - 1)
    readout.textContent = isClamped() ? `${actualWidth()} / ${requested} px` : `${actualWidth()} px`
    for (const button of presetButtons) {
      const pressed = presetWidth(button) === requested
      button.setAttribute('aria-pressed', String(pressed))
      button.toggleAttribute('data-clamped', pressed && isClamped())
    }
  }

  const width = createSplitter({
    handle: frameHandle,
    target: frame,
    property: '--frame-width',
    unit: 'px',
    min: 240,
    max: () => stage.clientWidth,
    defaultValue: null,
    storageKey: 'cody-preview-width',
    keys: { increase: 'ArrowRight', decrease: 'ArrowLeft' },
    step: 16,
    bigStep: 64,
    // The frame is centred, so dragging one edge moves both
    fromPointer: (event) => {
      const box = stage.getBoundingClientRect()
      return (event.clientX - (box.left + box.width / 2)) * 2
    },
    onChange: (preferred) => {
      requested = preferred
      frame.toggleAttribute('data-sized', preferred !== null) // a sized frame shows its edge
      showWidth()
    }
  })

  presets.addEventListener('click', (event) => {
    const button = event.target.closest('[data-width]')
    if (!button) return
    width.set(presetWidth(button), { exact: true }) // kept even when the pane is narrower
  })

  new ResizeObserver(showWidth).observe(frame)

  if (!document.fullscreenEnabled) fullscreenButton.hidden = true
  fullscreenButton.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else pane.requestFullscreen()
  })
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'
  })
}
