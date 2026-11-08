// The single owner of which view, editor and panel are showing. Desktop
// editor tabs and phone tabs both go through select(), so they can't
// disagree. CSS reads the data attributes to show and hide panels; on
// desktop `view` and `language` matter, on phones all three do.
export const VIEWS = ['web', 'js']
export const LANGUAGES = ['html', 'css', 'js']
export const PANELS = ['editor', 'preview', 'console']

// Choosing a language without naming a panel means "show that editor".
// The JS view has only the JS editor and the console.
export function nextState (state, change) {
  const view = VIEWS.includes(change.view) ? change.view : state.view
  let language = LANGUAGES.includes(change.language) ? change.language : state.language
  let panel = PANELS.includes(change.panel) ? change.panel : state.panel
  if (LANGUAGES.includes(change.language) && change.panel === undefined) panel = 'editor'
  if (view === 'js') {
    language = 'js'
    if (panel === 'preview') panel = 'editor'
  }
  return { view, language, panel }
}

export function createWorkspace (element, initial = { view: 'web', language: 'js', panel: 'editor' }) {
  let state = nextState(initial, {})
  const listeners = []

  function apply () {
    element.dataset.view = state.view
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
