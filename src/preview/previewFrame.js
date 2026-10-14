// Every render swaps in a fresh iframe. Changing srcdoc on the same iframe is
// a navigation, and each one adds a browser history entry, so Back would step
// through old previews instead of leaving them. A new iframe's first load
// doesn't add an entry.
export function createPreviewFrame (iframe) {
  let current = iframe

  return {
    // The current preview's window, used to tell its messages from stale ones
    get window () {
      return current.contentWindow
    },
    render (documentHtml) {
      const next = current.cloneNode(false)
      next.srcdoc = documentHtml
      current.replaceWith(next)
      current = next
    }
  }
}
