import { describe, it, expect, afterEach, vi } from 'vitest'
import { readStored, writeStored, removeStored } from '../../src/utils/storage'

afterEach(() => vi.unstubAllGlobals())

// Node has no localStorage, so these stub the global; the e2e tests cover
// real browser storage
describe('storage', () => {
  it('reads, writes and removes values', () => {
    const values = new Map()
    vi.stubGlobal('localStorage', {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    })
    writeStored('k', '1')
    expect(readStored('k')).toBe('1')
    removeStored('k')
    expect(readStored('k')).toBeNull()
  })

  // Private mode and blocked site data make localStorage throw; settings
  // then simply don't persist
  it('treats unavailable storage as empty instead of throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') }
    })
    expect(readStored('k')).toBeNull()
    expect(() => writeStored('k', '1')).not.toThrow()
    expect(() => removeStored('k')).not.toThrow()
  })
})
