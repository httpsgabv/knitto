import { describe, it, expect } from 'vitest'
import { sortObjectKeys } from './json'

describe('sortObjectKeys', () => {
  it('should sort object keys alphabetically', () => {
    const input = { z: '1', a: '2', m: '3' }
    const result = sortObjectKeys(input)
    expect(Object.keys(result!)).toEqual(['a', 'm', 'z'])
  })

  it('should return undefined for undefined input', () => {
    expect(sortObjectKeys(undefined)).toBeUndefined()
  })

  it('should handle empty object', () => {
    const input = {}
    const result = sortObjectKeys(input)
    expect(result).toEqual({})
    expect(Object.keys(result!)).toHaveLength(0)
  })

  it('should handle single key object', () => {
    const input = { b: 'value' }
    const result = sortObjectKeys(input)
    expect(result).toEqual({ b: 'value' })
  })

  it('should handle already sorted object', () => {
    const input = { a: '1', b: '2', c: '3' }
    const result = sortObjectKeys(input)
    expect(Object.keys(result!)).toEqual(['a', 'b', 'c'])
  })

  it('should handle numeric string keys', () => {
    const input = { '2': 'a', '1': 'b', '10': 'c' }
    const result = sortObjectKeys(input)
    expect(Object.keys(result!)).toEqual(['1', '2', '10'])
  })

  it('should preserve values', () => {
    const input = { z: 'last', a: 'first' }
    const result = sortObjectKeys(input)
    expect(result).toEqual({ a: 'first', z: 'last' })
  })

  it('should handle uppercase and lowercase keys', () => {
    const input = { Z: '1', a: '2', A: '3' }
    const result = sortObjectKeys(input)
    expect(Object.keys(result!)).toEqual(['a', 'A', 'Z'])
  })

  it('should handle keys with special characters', () => {
    const input = { 'z-index': '1', abc: '2', _private: '3' }
    const result = sortObjectKeys(input)
    expect(Object.keys(result!)).toEqual(['_private', 'abc', 'z-index'])
  })

  it('should not mutate the original object', () => {
    const input = { b: '1', a: '2' }
    const originalKeys = Object.keys(input)
    sortObjectKeys(input)
    expect(Object.keys(input)).toEqual(originalKeys)
  })

  it('should return a new object instance', () => {
    const input = { a: '1' }
    const result = sortObjectKeys(input)
    expect(result).not.toBe(input)
  })

  it('should handle undefined typed input', () => {
    const input: Record<string, string> | undefined = undefined
    const result = sortObjectKeys(input)
    expect(result).toBeUndefined()
  })
})
