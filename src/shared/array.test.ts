import { describe, it, expect } from 'vitest'
import { unique } from './array'

describe('unique', () => {
  it('should return empty array for empty input', () => {
    expect(unique([])).toEqual([])
  })

  it('should return same array when all elements are unique', () => {
    const input = [1, 2, 3]
    expect(unique(input)).toEqual([1, 2, 3])
  })

  it('should remove duplicate elements', () => {
    const input = [1, 2, 2, 3, 3, 3]
    expect(unique(input)).toEqual([1, 2, 3])
  })

  it('should preserve first occurrence order', () => {
    const input = [3, 1, 2, 1, 3]
    expect(unique(input)).toEqual([3, 1, 2])
  })

  it('should work with strings', () => {
    const input = ['a', 'b', 'a', 'c', 'b']
    expect(unique(input)).toEqual(['a', 'b', 'c'])
  })

  it('should work with mixed types', () => {
    const input = [1, 'a', 2, 'b', 1, 'a'] as const
    expect(unique(input)).toEqual([1, 'a', 2, 'b'])
  })

  it('should not mutate the original array', () => {
    const input = [1, 2, 2]
    unique(input)
    expect(input).toEqual([1, 2, 2])
  })

  it('should return a new array instance', () => {
    const input = [1, 2, 3]
    const result = unique(input)
    expect(result).not.toBe(input)
  })

  it('should work with readonly arrays', () => {
    const input: readonly number[] = [1, 2, 2, 3]
    expect(unique(input)).toEqual([1, 2, 3])
  })
})
