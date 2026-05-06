import type { MergePackageJsonManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { MergePackageJsonManifestOperationHandler } from './merge-package-json-manifest-operation.handler'

describe('MergePackageJsonManifestOperationHandler', () => {
  it('builds a merge-package-json operation', () => {
    const handler = new MergePackageJsonManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'merge-package-json',
        source: 'package.partial.json',
        target: 'package.json',
        strategy: 'safe-merge',
      })
    )

    expect(handler.type).toBe('merge-package-json')
    expect(result.id).toMatch(/^merge-package-json-\d+$/)
    expect(result).toMatchObject({
      type: 'merge-package-json',
      source: '/template/package.partial.json',
      target: '/target/package.json',
      strategy: 'safe-merge',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build merge-package-json',
    })
  })
})

function createBuildContext(
  operation: MergePackageJsonManifestOperation
): ManifestOperationBuildContext<MergePackageJsonManifestOperation> {
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
