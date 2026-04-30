import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import { formatError } from './format-error'
import { KnittoError } from '@core/errors/knitto-error'
import { Errors } from '@core/errors/errors'

describe('formatError', () => {
  it('should format KnittoError with code', () => {
    const error = new KnittoError('Something went wrong', Errors.KIT_NOT_FOUND)
    const result = formatError(error)
    expect(result).toBe('[KIT_NOT_FOUND] Something went wrong')
  })

  it('should format KnittoError without code', () => {
    const error = new KnittoError('Something went wrong', '')
    const result = formatError(error)
    expect(result).toBe('Something went wrong')
  })

  it('should format ZodError with first issue message', () => {
    const error = new ZodError([
      { message: 'First issue', path: ['field1'], code: 'custom' },
      { message: 'Second issue', path: ['field2'], code: 'custom' },
    ])
    const result = formatError(error)
    expect(result).toBe('First issue')
  })

  it('should format ZodError with default message when no issues', () => {
    const error = new ZodError([])
    const result = formatError(error)
    expect(result).toBe('Validation failed')
  })

  it('should format regular Error with message', () => {
    const error = new Error('Something broke')
    const result = formatError(error)
    expect(result).toBe('Something broke')
  })

  it('should return Unexpected error for unknown', () => {
    const result = formatError('not an error')
    expect(result).toBe('Unexpected error')
  })

  it('should return Unexpected error for null', () => {
    const result = formatError(null)
    expect(result).toBe('Unexpected error')
  })

  it('should return Unexpected error for undefined', () => {
    const result = formatError(undefined)
    expect(result).toBe('Unexpected error')
  })
})
