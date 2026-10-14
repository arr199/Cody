import { describe, it, expect } from 'vitest'
import { nextState, createWorkspace } from '../../src/ui/workspace'

const start = { language: 'js', panel: 'preview' }

describe('nextState', () => {
  it('shows the editor when only a language is chosen', () => {
    expect(nextState(start, { language: 'css' })).toEqual({ language: 'css', panel: 'editor' })
  })

  it('keeps the language when only a panel is chosen', () => {
    expect(nextState(start, { panel: 'console' })).toEqual({ language: 'js', panel: 'console' })
  })

  it('takes both when both are given (loading code keeps the current panel)', () => {
    expect(nextState(start, { language: 'html', panel: 'preview' })).toEqual({ language: 'html', panel: 'preview' })
  })

  it('ignores unknown values', () => {
    expect(nextState(start, { language: 'python', panel: 'sidebar' })).toEqual(start)
  })
})

describe('createWorkspace', () => {
  it('writes the state to the element and tells subscribers', () => {
    const element = { dataset: {} }
    const workspace = createWorkspace(element, start)
    const seen = []
    workspace.subscribe(state => seen.push(state))

    workspace.select({ language: 'html' })

    expect(element.dataset).toEqual({ language: 'html', panel: 'editor' })
    expect(workspace.state).toEqual({ language: 'html', panel: 'editor' })
    expect(seen).toEqual([start, { language: 'html', panel: 'editor' }])
  })
})
