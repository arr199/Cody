import { describe, it, expect } from 'vitest'
import { clampSize, parseStoredSize } from '../../src/ui/splitter'

describe('clampSize', () => {
  it('keeps values inside the limits', () => {
    expect(clampSize(50, 20, 80)).toBe(50)
    expect(clampSize(5, 20, 80)).toBe(20)
    expect(clampSize(95, 20, 80)).toBe(80)
  })
})

describe('parseStoredSize', () => {
  it('reads a stored number', () => {
    expect(parseStoredSize('62.5', 50)).toBe(62.5)
  })

  it('falls back when nothing usable is stored', () => {
    expect(parseStoredSize(null, 50)).toBe(50)
    expect(parseStoredSize('', 50)).toBe(50)
    expect(parseStoredSize('oops', 160)).toBe(160)
    expect(parseStoredSize(null, null)).toBeNull()
  })
})
