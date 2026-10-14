const TOAST_DURATION = 1500

// A short status message in the shared toast element
export function createToast (container) {
  const text = container.querySelector('span')
  let hideTimer
  return {
    show (message) {
      text.textContent = message
      container.classList.add('visible')
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => container.classList.remove('visible'), TOAST_DURATION)
    }
  }
}
