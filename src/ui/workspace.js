// The single owner of which editor and which panel are showing. Desktop
// editor tabs and phone tabs both go through select(), so they can't
// disagree. CSS reads the data attributes to show and hide panels; on
// desktop only `language` matters, on phones both do.
export const LANGUAGES = ['html', 'css', 'js']
export const PANELS = ['editor', 'preview', 'console']

// Choosing a language without naming a panel means "show that editor"
export function nextState (state, change) {
  const language = LANGUAGES.includes(change.language) ? change.language : state.language
  let panel = PANELS.includes(change.panel) ? change.panel : state.panel
  if (LANGUAGES.includes(change.language) && change.panel === undefined) panel = 'editor'
  return { language, panel }
}

// Phones open on the preview, so a first visit shows the example running
export function createWorkspace (element, initial = { language: 'js', panel: 'preview' }) {
  let state = initial
  const listeners = []

  function apply () {
    element.dataset.language = state.language
    element.dataset.panel = state.panel
    for (const listener of listeners) listener(state)
  }
  apply()

  return {
    get state () {
      return state
    },
    select (change) {
      state = nextState(state, change)
      apply()
    },
    subscribe (listener) {
      listeners.push(listener)
      listener(state)
    }
  }
}
