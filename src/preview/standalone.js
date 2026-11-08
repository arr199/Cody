import { decodeState } from '../state/urlCodec'
import { buildDocument } from './buildDocument'
import { createPreviewFrame } from './previewFrame'

// Only the hash carries code here: this page's own path is not a legacy link
const preview = createPreviewFrame(document.querySelector('#page'))
const render = () => preview.render(buildDocument(decodeState({ hash: window.location.hash, pathname: '/' })))

render()
window.addEventListener('hashchange', render)
