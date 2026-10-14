// Starter examples. Each lives in its own folder as real HTML, CSS and JS
// files, imported as text so they load into the editors exactly as written.
import welcomeHtml from './welcome/markup.html?raw'
import welcomeCss from './welcome/style.css?raw'
import welcomeJs from './welcome/script.js?raw'
import flexboxHtml from './flexbox/markup.html?raw'
import flexboxCss from './flexbox/style.css?raw'
import flexboxJs from './flexbox/script.js?raw'
import canvasHtml from './canvas/markup.html?raw'
import canvasCss from './canvas/style.css?raw'
import canvasJs from './canvas/script.js?raw'
import todoHtml from './todo/markup.html?raw'
import todoCss from './todo/style.css?raw'
import todoJs from './todo/script.js?raw'

// `meta` is the second line in the Examples menu (what the example teaches);
// `description` is shown beside its live preview
export const EXAMPLES = [
  {
    id: 'welcome',
    title: 'Cracktro',
    meta: 'CSS animation · the edit loop',
    description: 'A demoscene-style intro: letters ride a wave over drifting dust. Edit --wave or the scrolling MESSAGE, click a letter.',
    html: welcomeHtml,
    css: welcomeCss,
    js: welcomeJs
  },
  {
    id: 'flexbox',
    title: 'Flexbox cards',
    meta: 'flex-wrap · grow · gap',
    description: 'Five cards, each explaining a flexbox property with a tiny live demo. Edit --card-min to rewrap them.',
    html: flexboxHtml,
    css: flexboxCss,
    js: flexboxJs
  },
  {
    id: 'canvas',
    title: 'Fireflies',
    meta: 'Canvas · requestAnimationFrame',
    description: 'A jar of fireflies pulsing at dusk. Tap the glass to startle them, and find the odd one out.',
    html: canvasHtml,
    css: canvasCss,
    js: canvasJs
  },
  {
    id: 'todo',
    title: 'Cork board',
    meta: 'Forms · event delegation · state',
    description: 'Errands as pinned index cards. Pin new ones, stamp them done, unpin them. Edit --tilt to hang them crooked.',
    html: todoHtml,
    css: todoCss,
    js: todoJs
  },
  {
    id: 'blank',
    title: 'Blank',
    meta: 'Start from scratch',
    description: 'Empty editors. Everything you write shows up in the preview and the console.',
    html: '',
    css: '',
    js: ''
  }
]

// Shown on a first visit, when the link carries no code
export const DEFAULT_EXAMPLE_ID = 'welcome'

export function getExample (id) {
  return EXAMPLES.find(example => example.id === id)
}
