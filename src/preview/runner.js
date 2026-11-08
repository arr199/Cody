import { readStored, writeStored } from '../utils/storage'

const AUTO_RUN_KEY = 'cody-auto-run'

// Decides when the preview runs the code. With auto-run on, an edit runs it
// once the language's delay has passed without further edits; with auto-run
// off, edits wait for runNow() and the preview is out of date (stale) until
// then. The choice is remembered.
export function createRunner ({ run, delays }) {
  let autoRun = readStored(AUTO_RUN_KEY) !== 'off'
  let pending = false // edits the preview hasn't run yet
  let timer
  const listeners = new Set()

  const state = () => ({ autoRun, stale: pending && !autoRun })
  const notify = () => listeners.forEach(listener => listener(state()))

  function runNow () {
    clearTimeout(timer)
    pending = false
    run()
    notify()
  }

  function edited (language) {
    pending = true
    clearTimeout(timer)
    if (autoRun) timer = setTimeout(runNow, delays[language])
    notify()
  }

  function setAutoRun (on) {
    autoRun = on
    writeStored(AUTO_RUN_KEY, on ? 'on' : 'off')
    clearTimeout(timer)
    if (on && pending) runNow()
    else notify()
  }

  return {
    runNow,
    edited,
    setAutoRun,
    get autoRun () {
      return autoRun
    },
    subscribe (listener) {
      listeners.add(listener)
      listener(state())
    }
  }
}
