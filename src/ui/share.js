import { hasCode, encodeState } from '../state/urlCodec'
import { saveSnippet, snippetUrl } from '../share/snippetClient'

function shareLink (code) {
  if (!hasCode(code)) return Promise.resolve({ link: `${window.location.origin}/`, saved: true })
  return saveSnippet(code)
    .then(id => ({ link: snippetUrl(id), saved: true }))
    .catch(error => {
      console.warn('Could not save the code, copying the full link instead.', error)
      return { link: `${window.location.origin}/#${encodeState(code)}`, saved: false }
    })
}

// A pending ClipboardItem claims the clipboard during the click, before the save finishes (Safari)
async function copyToClipboard (textPromise) {
  if (window.ClipboardItem && navigator.clipboard.write) {
    const blob = textPromise.then(text => new Blob([text], { type: 'text/plain' }))
    await navigator.clipboard.write([new window.ClipboardItem({ 'text/plain': blob })])
  } else {
    await navigator.clipboard.writeText(await textPromise)
  }
}

export function setupShare (button, toast, getCode) {
  button.addEventListener('click', async () => {
    button.disabled = true
    const result = shareLink(getCode())
    try {
      await copyToClipboard(result.then(({ link }) => link))
      if ((await result).saved) toast.show('Link copied', 'ok')
      else toast.show("Couldn't save, copied the full link instead")
    } catch (error) {
      console.error('Could not copy the link.', error)
      toast.show("Couldn't copy the link")
    } finally {
      button.disabled = false
    }
  })
}
