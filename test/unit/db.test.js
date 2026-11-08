import { describe, it, expect } from 'vitest'
import { connectionUrl } from '../../api/_lib/db'

describe('connectionUrl', () => {
  // Neon's connection strings include channel_binding, which postgres.js would
  // send to the server as an unknown setting, failing every connection
  it('drops parameters the driver would pass on as server settings', () => {
    const url = 'postgresql://u:p@ep-x-pooler.neon.tech/neondb?sslmode=require&channel_binding=require'
    expect(connectionUrl(url)).toBe('postgresql://u:p@ep-x-pooler.neon.tech/neondb?sslmode=require')
  })

  it('leaves other URLs as they are', () => {
    expect(connectionUrl('postgres://cody:cody@localhost:5432/cody')).toBe('postgres://cody:cody@localhost:5432/cody')
  })
})
