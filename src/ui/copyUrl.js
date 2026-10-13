import { API } from '../utils/API'

const TOAST_DURATION = 1500

async function shortenUrl (url) {
  const res = await fetch(API.LINK_SHORTENER_URL, {
    method: 'POST',
    body: JSON.stringify({ content: url }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) throw new Error(`Link shortener responded with ${res.status}`)
  const { link } = await res.json()
  if (!link) throw new Error('Link shortener returned no link')
  return link
}

// Falls back to the full URL when the shortener is unavailable.
async function getShareLink () {
  const url = window.location.href
  try {
    return await shortenUrl(url)
  } catch (err) {
    console.warn('Could not shorten the URL, copying the full URL instead.', err)
    return url
  }
}

// Browsers only allow clipboard writes shortly after a click. Handing the
// clipboard a pending ClipboardItem claims the write right away, so a slow
// shortener doesn't make it fail (Safari is strict about this).
async function copyToClipboard (textPromise) {
  if (window.ClipboardItem && navigator.clipboard.write) {
    const blob = textPromise.then(text => new Blob([text], { type: 'text/plain' }))
    await navigator.clipboard.write([new window.ClipboardItem({ 'text/plain': blob })])
  } else {
    await navigator.clipboard.writeText(await textPromise)
  }
}

export function setupCopyUrl (button, toast) {
  const toastText = toast.querySelector('span')
  let hideTimer

  function showToast (message) {
    toastText.textContent = message
    toast.classList.add('visible')
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => toast.classList.remove('visible'), TOAST_DURATION)
  }

  button.addEventListener('click', async () => {
    button.disabled = true
    try {
      await copyToClipboard(getShareLink())
      showToast('URL Copied to Clipboard')
    } catch (err) {
      console.error('Could not copy the URL.', err)
      showToast("Couldn't copy the URL")
    } finally {
      button.disabled = false
    }
  })
}
