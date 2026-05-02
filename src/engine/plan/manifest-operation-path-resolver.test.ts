import { Errors } from '@core/errors/errors'
import { describe, expect, it } from 'vitest'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'

describe('ManifestOperationPathResolver', () => {
  const resolver = new ManifestOperationPathResolver()

  it('resolves contained source and target paths', () => {
    expect(resolver.resolveSource('/templates/auth', 'src/auth.ts')).toBe(
      '/templates/auth/src/auth.ts'
    )
    expect(resolver.resolveTarget('/projects/demo', 'src/auth.ts')).toBe(
      '/projects/demo/src/auth.ts'
    )
  })

  it('rejects source paths that escape the template root', () => {
    expect(() =>
      resolver.resolveSource('/templates/auth', '../secrets.env')
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_MANIFEST_OPERATION_PATH,
        message: 'Manifest operation source escapes template root: ../secrets.env',
      })
    )
  })

  it('rejects target paths that escape the target directory', () => {
    expect(() =>
      resolver.resolveTarget('/projects/demo', '../outside/.env.example')
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_MANIFEST_OPERATION_PATH,
        message:
          'Manifest operation target escapes target directory: ../outside/.env.example',
      })
    )
  })
})
