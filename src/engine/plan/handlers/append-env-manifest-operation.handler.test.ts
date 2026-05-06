import type { AppendEnvManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AppendEnvManifestOperationHandler } from './append-env-manifest-operation.handler'

describe('AppendEnvManifestOperationHandler', () => {
  it('builds an append-env operation', () => {
    const handler = new AppendEnvManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'append-env',
        source: 'env/.env.example',
        target: '.env.example',
        strategy: 'append-missing',
      })
    )

    expect(handler.type).toBe('append-env')
    expect(result.id).toMatch(/^append-env-\d+$/)
    expect(result).toMatchObject({
      type: 'append-env',
      source: '/template/env/.env.example',
      target: '/target/.env.example',
      strategy: 'append-missing',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build append-env',
    })
  })
})

function createBuildContext(
  operation: AppendEnvManifestOperation
): ManifestOperationBuildContext<AppendEnvManifestOperation> {
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
