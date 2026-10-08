import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, parseSettings } from './settings'

describe('settings', () => {
  it('keeps valid saved choices', () => {
    const saved = { cardStyle: 'four-color', cardBack: 'blue', table: 'dark', animations: false }
    expect(parseSettings(saved)).toEqual(saved)
  })

  it('falls back to defaults for missing or unknown values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings({ cardStyle: 'neon', table: 'blue', animations: 'yes' })).toEqual({ ...DEFAULT_SETTINGS, table: 'blue' })
  })
})
