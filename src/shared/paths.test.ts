import { describe, it, expect } from 'vitest'
import { normalizeSlashes } from './paths'

describe('normalizeSlashes', () => {
  it('should convert backslashes to forward slashes', () => {
    expect(normalizeSlashes('path\\to\\file')).toBe('path/to/file')
  })

  it('should return same string when no backslashes', () => {
    expect(normalizeSlashes('path/to/file')).toBe('path/to/file')
  })

  it('should handle empty string', () => {
    expect(normalizeSlashes('')).toBe('')
  })

  it('should handle single backslash', () => {
    expect(normalizeSlashes('\\')).toBe('/')
  })

  it('should handle multiple consecutive backslashes', () => {
    expect(normalizeSlashes('path\\\\to\\\\file')).toBe('path/to/file')
  })

  it('should handle Windows-style absolute path', () => {
    expect(normalizeSlashes('C:\\Users\\Name\\Documents')).toBe(
      'C:/Users/Name/Documents'
    )
  })

  it('should handle mixed slashes', () => {
    expect(normalizeSlashes('C:/Users\\Name/Documents')).toBe(
      'C:/Users/Name/Documents'
    )
  })

  it('should preserve forward slashes', () => {
    expect(normalizeSlashes('https://example.com/path/to/file')).toBe(
      'https://example.com/path/to/file'
    )
  })

  it('should handle path with trailing slash', () => {
    expect(normalizeSlashes('path\\to\\directory\\')).toBe('path/to/directory/')
  })

  it('should handle path starting with backslash', () => {
    expect(normalizeSlashes('\\path\\to\\file')).toBe('/path/to/file')
  })

  it('should handle complex Windows path', () => {
    const input = 'D:\\Projects\\my-app\\src\\components\\Button.tsx'
    const expected = 'D:/Projects/my-app/src/components/Button.tsx'
    expect(normalizeSlashes(input)).toBe(expected)
  })
})
