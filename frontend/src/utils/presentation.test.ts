import { describe, expect, it } from 'vitest'
import { getInitials } from './presentation'

describe('getInitials', () => {
  it('uses the first letters of the first two words', () => {
    expect(getInitials('Test Elek')).toBe('TE')
    expect(getInitials('Szép Anna')).toBe('SA')
    expect(getInitials('Kiss Anna Mária')).toBe('KA')
  })

  it('uses one letter for a single word', () => {
    expect(getInitials('admin')).toBe('A')
  })

  it('ignores extra whitespace', () => {
    expect(getInitials('  test   elek ')).toBe('TE')
  })

  it('returns an empty string when there is no name', () => {
    expect(getInitials('')).toBe('')
    expect(getInitials('   ')).toBe('')
    expect(getInitials(undefined)).toBe('')
  })
})
