import { readStored, writeStored, removeStored } from '../utils/storage'

export function clampSize (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// A stored size is a number, or the fallback when nothing usable is stored
export function parseStoredSize (raw, fallback) {
  const value = Number.parseFloat(raw)
  return raw !== null && Number.isFinite(value) ? value : fallback
}

// A draggable, keyboard-operable separator that sizes one CSS custom property
// on `target`. Values are numbers in `unit`; `min` and `max` may be functions
// so they follow the current layout. A null value removes the property, so
// the stylesheet's default applies.
//
// Two sizes are kept apart: `preferred` is what the user chose (and what is
// saved); the applied size is that, clamped to the current limits. A smaller
// window or a hidden pane changes only the applied size, so the chosen one
// comes back when there is room again.
export function createSplitter ({
  handle, target, property, unit, min, max, defaultValue,
  storageKey, fromPointer, keys, step, bigStep, onChange
}) {
  const limit = (bound) => (typeof bound === 'function' ? bound() : bound)
  let preferred = null
  let applied = null

  function apply () {
    const low = limit(min)
    const high = limit(max)
    if (!(high > 0) || high < low) return // a hidden pane has no room to measure; keep what's shown
    applied = preferred === null ? null : clampSize(preferred, low, high)
    if (applied === null) target.style.removeProperty(property)
    else target.style.setProperty(property, applied + unit)

    handle.setAttribute('aria-valuemin', String(Math.round(low)))
    handle.setAttribute('aria-valuemax', String(Math.round(high)))
    handle.setAttribute('aria-valuenow', String(Math.round(applied ?? high)))
    onChange?.(preferred)
  }

  // `exact` keeps a value wider than today's limits (a device preset);
  // everything else is clamped to what the user can see
  function set (next, { persist = true, exact = false } = {}) {
    preferred = next === null || exact ? next : clampSize(next, limit(min), limit(max))
    if (persist) {
      if (preferred === null) removeStored(storageKey)
      else writeStored(storageKey, String(preferred))
    }
    apply()
  }

  // Pointer capture keeps the drag going over the editors. The sandboxed
  // preview is a separate frame that would swallow the pointer anyway, so
  // `is-resizing` on the root makes iframes ignore it until the drag ends.
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    handle.classList.add('is-dragging')
    document.documentElement.classList.add('is-resizing')
  })
  handle.addEventListener('pointermove', (event) => {
    if (handle.hasPointerCapture(event.pointerId)) set(fromPointer(event))
  })
  handle.addEventListener('lostpointercapture', () => {
    handle.classList.remove('is-dragging')
    document.documentElement.classList.remove('is-resizing')
  })

  handle.addEventListener('keydown', (event) => {
    const amount = event.shiftKey ? bigStep : step
    const current = applied ?? limit(max)
    const next = {
      [keys.increase]: current + amount,
      [keys.decrease]: current - amount,
      Home: limit(min),
      End: limit(max)
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    set(next)
  })

  handle.addEventListener('dblclick', () => set(defaultValue))

  // A window resize changes the limits; re-apply the chosen size within them
  window.addEventListener('resize', apply)

  set(parseStoredSize(readStored(storageKey), defaultValue), { persist: false, exact: true })

  return {
    set,
    get value () {
      return preferred
    },
    reset: () => set(defaultValue)
  }
}
