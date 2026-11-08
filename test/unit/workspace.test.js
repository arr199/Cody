import { describe, it, expect } from 'vitest'
import { nextState, createWorkspace } from '../../src/ui/workspace'
import { viewFor } from '../../src/ui/viewToggle'

const start = { view: 'web', language: 'js', panel: 'preview' }

describe('nextState', () => {
  it('shows the editor when only a language is chosen', () => {
    expect(nextState(start, { language: 'css' })).toEqual({ view: 'web', language: 'css', panel: 'editor' })
  })

  it('keeps the language when only a panel is chosen', () => {
    expect(nextState(start, { panel: 'console' })).toEqual({ view: 'web', language: 'js', panel: 'console' })
  })

  it('takes both when both are given (loading code keeps the current panel)', () => {
    expect(nextState(start, { language: 'html', panel: 'preview' })).toEqual({ view: 'web', language: 'html', panel: 'preview' })
  })

  it('ignores unknown values', () => {
    expect(nextState(start, { view: 'python', language: 'python', panel: 'sidebar' })).toEqual(start)
  })

  it('keeps the JS view on the JS editor, without the preview', () => {
    const css = { view: 'web', language: 'css', panel: 'preview' }
    expect(nextState(css, { view: 'js' })).toEqual({ view: 'js', language: 'js', panel: 'editor' })
    const js = { view: 'js', language: 'js', panel: 'console' }
    expect(nextState(js, { language: 'html' })).toEqual({ view: 'js', language: 'js', panel: 'editor' })
    expect(nextState(js, { panel: 'preview' })).toEqual({ view: 'js', language: 'js', panel: 'editor' })
  })
})

describe('createWorkspace', () => {
  it('writes the state to the element and tells subscribers', () => {
    const element = { dataset: {} }
    const workspace = createWorkspace(element, start)
    const seen = []
    workspace.subscribe(state => seen.push(state))

    workspace.select({ language: 'html' })

    expect(element.dataset).toEqual({ view: 'web', language: 'html', panel: 'editor' })
    expect(workspace.state).toEqual({ view: 'web', language: 'html', panel: 'editor' })
    expect(seen).toEqual([start, { view: 'web', language: 'html', panel: 'editor' }])
  })

  it('starts the JS view on the JS editor', () => {
    const workspace = createWorkspace({ dataset: {} }, { view: 'js', language: 'html', panel: 'preview' })
    expect(workspace.state).toEqual({ view: 'js', language: 'js', panel: 'editor' })
  })
})

describe('viewFor', () => {
  it('opens only JS in the JS view, and markup or styles in the web view', () => {
    expect(viewFor({ html: '', css: '', js: 'x' }, 'web')).toBe('js')
    expect(viewFor({ html: '<p>', css: '', js: 'x' }, 'js')).toBe('web')
    expect(viewFor({ html: '', css: 'p {}', js: '' }, 'js')).toBe('web')
  })

  it('keeps the current view for empty code', () => {
    expect(viewFor({ html: '', css: '', js: '' }, 'js')).toBe('js')
    expect(viewFor({ html: '', css: '', js: '' }, 'web')).toBe('web')
  })
})
