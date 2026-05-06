import type { CopyFileManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { CopyFileManifestOperationHandler } from './copy-file-manifest-operation.handler'

describe('CopyFileManifestOperationHandler', () => {
  it('builds a copy-file operation', () => {
    const handler = new CopyFileManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'copy-file',
        source: 'template/src/main.ts',
        target: 'src/main.ts',
        overwrite: true,
        renderVariables: false,
      })
    )

    expect(handler.type).toBe('copy-file')
    expect(result.id).toMatch(/^copy-\d+$/)
    expect(result).toMatchObject({
      type: 'copy-file',
      source: '/template/template/src/main.ts',
      target: '/target/src/main.ts',
      overwrite: true,
      renderVariables: false,
      origin: { type: 'feature', slug: 'auth' },
      description: 'build copy-file',
    })
  })
})

function createBuildContext(
  operation: CopyFileManifestOperation
): ManifestOperationBuildContext<CopyFileManifestOperation> {
  return {
    operation,
    templateDir: '/template',
    targetDir: '/target',
    origin: { type: 'feature', slug: 'auth' },
    description: `build ${operation.type}`,
    resolveSource: (source) => `/template/${source}`,
    resolveTarget: (target) => `/target/${target}`,
  }
}
