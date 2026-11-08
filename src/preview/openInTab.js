import { encodeState } from '../state/urlCodec'

// preview.html renders the code from its hash, in the same sandbox as the
// app's preview
export function previewUrl (code) {
  return `${import.meta.env.BASE_URL}preview.html#${encodeState(code)}`
}

// window.open with "noopener" always returns null, which would hide a
// blocked pop-up; open normally, then cut the link back to the app instead
export function setupOpenInTab (button, getCode, toast) {
  button.addEventListener('click', () => {
    const tab = window.open(previewUrl(getCode()), '_blank')
    if (!tab) {
      toast.show('Allow pop-ups to open the preview')
      return
    }
    tab.opener = null
  })
}
