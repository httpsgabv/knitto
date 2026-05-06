import path from 'node:path'
import { Errors } from '@core/errors/errors'
import { normalizeSystemPath } from '@shared/paths'
import { describe, expect, it } from 'vitest'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'

describe('ManifestOperationPathResolver', () => {
  const resolver = new ManifestOperationPathResolver()

  it('resolves contained source and target paths', () => {
    expect(resolver.resolveSource('/templates/auth', 'src/auth.ts')).toBe(
      normalizeSystemPath(path.resolve('/templates/auth', 'src/auth.ts'))
    )
    expect(resolver.resolveTarget('/projects/demo', 'src/auth.ts')).toBe(
      normalizeSystemPath(path.resolve('/projects/demo', 'src/auth.ts'))
    )
  })

  it('normalizes windows source and target paths', () => {
    expect(resolver.resolveSource('C:\\templates\\auth', 'src\\auth.ts')).toBe(
      'C:/templates/auth/src/auth.ts'
    )
    expect(
      resolver.resolveTarget('C:\\projects\\demo-app', 'src\\auth.ts')
    ).toBe('C:/projects/demo-app/src/auth.ts')
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
