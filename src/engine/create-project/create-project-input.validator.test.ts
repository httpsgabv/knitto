import { afterEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import { Errors } from '@core/errors/errors'
import { CreateProjectInputValidator } from './create-project-input.validator'
import { CreateProjectInputSchema } from './create-project-input.schema'

describe('CreateProjectInputValidator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed create-project input for valid data', () => {
    const validator = new CreateProjectInputValidator()

    const result = validator.validate({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: ' apps/demo-app ',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result).toEqual({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })
  })

  it('translates schema validation failures into a KnittoError', () => {
    const validator = new CreateProjectInputValidator()

    expect(() =>
      validator.validate({
        projectName: 'Demo App',
        kitSlug: 'next-base',
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_CREATE_PROJECT_INPUT,
        message:
          'Project name must use lowercase letters, numbers, hyphens, or underscores, and start with a letter or number',
        details: expect.arrayContaining([
          expect.objectContaining({
            message:
              'Project name must use lowercase letters, numbers, hyphens, or underscores, and start with a letter or number',
          }),
        ]),
      })
    )
  })

  it('uses a fallback message when a schema error has no first issue message', () => {
    const validator = new CreateProjectInputValidator()

    vi.spyOn(CreateProjectInputSchema, 'parse').mockImplementationOnce(() => {
      throw new ZodError([])
    })

    expect(() => validator.validate({} as never)).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_CREATE_PROJECT_INPUT,
        message: 'Invalid create project input',
        details: [],
      })
    )
  })

  it('rethrows unexpected parse errors', () => {
    const validator = new CreateProjectInputValidator()
    const unexpectedError = new Error('parse exploded')

    vi.spyOn(CreateProjectInputSchema, 'parse').mockImplementationOnce(() => {
      throw unexpectedError
    })

    expect(() => validator.validate({} as never)).toThrow(unexpectedError)
  })
})
