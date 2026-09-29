import { describe, expect, it } from 'vitest'
import { en } from './en'
import { hu } from './hu'

function flatten(value: object, prefix = ''): [string, unknown][] {
  return Object.entries(value).flatMap(([key, child]): [string, unknown][] => {
    const path = prefix ? `${prefix}.${key}` : key

    return typeof child === 'object' && child !== null
      ? flatten(child, path)
      : [[path, child]]
  })
}

function describeShape(locale: object) {
  return flatten(locale)
    .map(([path, value]) => `${path}: ${typeof value}`)
    .sort()
}

describe('locales', () => {
  it('have the same keys and value types in Hungarian and English', () => {
    expect(describeShape(hu)).toEqual(describeShape(en))
  })

  it('have no empty texts', () => {
    const emptyPaths = [...flatten(hu), ...flatten(en)]
      .filter(([, value]) => typeof value === 'string' && value.trim() === '')
      .map(([path]) => path)

    expect(emptyPaths).toEqual([])
  })
})
