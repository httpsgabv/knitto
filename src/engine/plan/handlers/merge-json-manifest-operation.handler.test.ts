import type { MergeJsonManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { MergeJsonManifestOperationHandler } from './merge-json-manifest-operation.handler'

describe('MergeJsonManifestOperationHandler', () => {
  it('builds a merge-json operation', () => {
    const handler = new MergeJsonManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'merge-json',
        source: 'tsconfig.patch.json',
        target: 'tsconfig.json',
        strategy: 'deep-merge',
      })
    )

    expect(handler.type).toBe('merge-json')
    expect(result.id).toMatch(/^merge-json-\d+$/)
    expect(result).toMatchObject({
      type: 'merge-json',
      source: '/template/tsconfig.patch.json',
      target: '/target/tsconfig.json',
      strategy: 'deep-merge',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build merge-json',
    })
  })
})

function createBuildContext(
  operation: MergeJsonManifestOperation
): ManifestOperationBuildContext<MergeJsonManifestOperation> {
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
