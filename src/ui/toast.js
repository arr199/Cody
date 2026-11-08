const TOAST_DURATION = { ok: 1500, warn: 3500 }

// tone: 'ok' or 'warn'
export function createToast (container) {
  const text = container.querySelector('.toast-text')
  let hideTimer
  return {
    show (message, tone = 'warn') {
      text.textContent = message
      container.dataset.tone = tone
      container.classList.add('visible')
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => container.classList.remove('visible'), TOAST_DURATION[tone])
    }
  }
}
