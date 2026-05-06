import type { AppendReadmeManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AppendReadmeManifestOperationHandler } from './append-readme-manifest-operation.handler'

describe('AppendReadmeManifestOperationHandler', () => {
  it('builds an append-readme operation', () => {
    const handler = new AppendReadmeManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'append-readme',
        source: 'docs/readme-fragment.md',
        target: 'README.md',
        heading: 'Getting Started',
      })
    )

    expect(handler.type).toBe('append-readme')
    expect(result.id).toMatch(/^append-readme-\d+$/)
    expect(result).toMatchObject({
      type: 'append-readme',
      source: '/template/docs/readme-fragment.md',
      target: '/target/README.md',
      heading: 'Getting Started',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build append-readme',
    })
  })
})

function createBuildContext(
  operation: AppendReadmeManifestOperation
): ManifestOperationBuildContext<AppendReadmeManifestOperation> {
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
