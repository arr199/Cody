// Connects each .run-controls group (the editor bar on desktop, the preview
// toolbar on phones) and Ctrl/Cmd+Enter to the runner (src/preview/runner.js).
export function connectRunControls (groups, runner) {
  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform)
  const parts = [...groups].map(group => ({
    toggle: group.querySelector('.auto-run'),
    button: group.querySelector('.run-button')
  }))

  for (const { toggle, button } of parts) {
    toggle.addEventListener('click', () => runner.setAutoRun(!runner.autoRun))
    button.addEventListener('click', () => runner.runNow())
    button.title = `Run (${isMac ? '⌘' : 'Ctrl'}+Enter)`
  }

  runner.subscribe(({ autoRun, stale }) => {
    for (const { toggle, button } of parts) {
      toggle.setAttribute('aria-checked', String(autoRun))
      button.toggleAttribute('data-stale', stale)
      button.setAttribute('aria-label', stale ? 'Run, preview out of date' : 'Run') // the dot, in words
    }
  })

  // Listens in the capture phase so it runs before Monaco, where Ctrl+Enter
  // would otherwise insert a line. Keys pressed inside the sandboxed preview
  // never reach the app, so the shortcut can't work from there.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return
    event.preventDefault()
    event.stopPropagation()
    runner.runNow()
  }, true)
}
