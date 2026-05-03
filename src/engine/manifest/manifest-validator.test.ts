import { afterEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import { Errors } from '@core/errors/errors'
import { ManifestSchema } from '@core/manifest/manifest.schema'
import { ManifestValidator } from './manifest-validator'

describe('ManifestValidator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the parsed manifest for valid input', () => {
    const validator = new ManifestValidator()

    expect(
      validator.validate({
        schemaVersion: 1,
        type: 'kit',
        slug: 'base',
        name: 'Base',
        description: 'Base template.',
        supports: [],
        requires: [],
        conflictsWith: [],
      })
    ).toEqual({
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
      name: 'Base',
      description: 'Base template.',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [],
    })
  })

  it('translates schema validation failures into a KnittoError', () => {
    const validator = new ManifestValidator()

    expect(() =>
      validator.validate({
        schemaVersion: 1,
        type: 'feature',
        slug: 'auth',
        name: 'Authentication',
        description: 'Adds auth.',
        supports: [],
        requires: [],
        conflictsWith: [],
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_TEMPLATE_MANIFEST,
        message: 'Too small: expected array to have >=1 items',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: 'Too small: expected array to have >=1 items',
          }),
        ]),
      })
    )
  })

  it('uses a fallback message when a schema error has no first issue message', () => {
    const validator = new ManifestValidator()

    vi.spyOn(ManifestSchema, 'parse').mockImplementationOnce(() => {
      throw new ZodError([])
    })

    expect(() => validator.validate({} as never)).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_TEMPLATE_MANIFEST,
        message: 'Invalid template manifest',
        details: [],
      })
    )
  })

  it('rethrows unexpected parse errors', () => {
    const validator = new ManifestValidator()
    const unexpectedError = new Error('parse exploded')

    vi.spyOn(ManifestSchema, 'parse').mockImplementationOnce(() => {
      throw unexpectedError
    })

    expect(() => validator.validate({} as never)).toThrow(unexpectedError)
  })
})
