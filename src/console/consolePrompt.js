import { monaco } from '../editors'

const HISTORY_SIZE = 100

// The console prompt's keys:
// - Enter runs the entry (Tab accepts a completion);
// - Shift+Enter adds a line;
// - ↑ on the first line and ↓ on the last step through this session's entries.
// onSubmit(code) receives each entry.
export function connectPrompt (editor, onSubmit) {
  const { KeyCode, KeyMod } = monaco
  // Monaco's keybindings are shared by every editor on the page; this context
  // key keeps these to the prompt, so Enter in the JS pane still adds a line
  editor.createContextKey('codyPrompt', true)

  const history = []
  let index = 0 // history.length stands for the entry being typed
  let draft = ''

  function show (next) {
    if (index === history.length) draft = editor.getValue()
    index = next
    editor.setValue(index === history.length ? draft : history[index])
    editor.setPosition(editor.getModel().getFullModelRange().getEndPosition())
  }

  function submit () {
    const code = editor.getValue()
    if (!code.trim()) return
    if (history.at(-1) !== code) history.push(code)
    if (history.length > HISTORY_SIZE) history.shift()
    index = history.length
    draft = ''
    editor.setValue('')
    onSubmit(code)
  }

  editor.addCommand(KeyCode.Enter, submit, 'codyPrompt')
  editor.addCommand(KeyMod.Shift | KeyCode.Enter, () => editor.trigger('keyboard', 'type', { text: '\n' }), 'codyPrompt')
  editor.addCommand(KeyCode.UpArrow, () => {
    if (editor.getPosition().lineNumber === 1 && index > 0) show(index - 1)
    else editor.trigger('keyboard', 'cursorUp', null)
  }, 'codyPrompt && !suggestWidgetVisible')
  editor.addCommand(KeyCode.DownArrow, () => {
    const onLastLine = editor.getPosition().lineNumber === editor.getModel().getLineCount()
    if (onLastLine && index < history.length) show(index + 1)
    else editor.trigger('keyboard', 'cursorDown', null)
  }, 'codyPrompt && !suggestWidgetVisible')
}
