import { describe, it, expect } from 'vitest'
import { createId } from './ids'

describe('createId', () => {
  it('should create an id with the given prefix', () => {
    const id = createId('test')
    expect(id).toMatch(/^test-\d+$/)
  })

  it('should create unique ids for each call', () => {
    const id1 = createId('item')
    const id2 = createId('item')
    const id3 = createId('item')
    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })

  it('should create ids with incrementing counter', () => {
    const id1 = createId('prefix')
    const id2 = createId('prefix')
    const id3 = createId('prefix')

    // Extract counter from ids (format: prefix-number)
    const counter1 = parseInt(id1.split('-').pop()!)
    const counter2 = parseInt(id2.split('-').pop()!)
    const counter3 = parseInt(id3.split('-').pop()!)

    expect(counter2).toBe(counter1 + 1)
    expect(counter3).toBe(counter2 + 1)
  })

  it('should handle empty prefix', () => {
    const id = createId('')
    expect(id).toMatch(/^-\d+$/)
  })

  it('should handle prefix with special characters', () => {
    const id = createId('test-prefix_123')
    expect(id).toMatch(/^test-prefix_123-\d+$/)
  })

  it('should handle single character prefix', () => {
    const id = createId('a')
    expect(id).toMatch(/^a-\d+$/)
  })
})
