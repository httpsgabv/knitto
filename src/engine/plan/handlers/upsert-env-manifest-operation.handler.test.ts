import type { UpsertEnvManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { UpsertEnvManifestOperationHandler } from './upsert-env-manifest-operation.handler'

describe('UpsertEnvManifestOperationHandler', () => {
  it('builds an upsert-env operation', () => {
    const handler = new UpsertEnvManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'upsert-env',
        target: '.env',
        values: {
          DATABASE_URL: 'postgresql://localhost:5432/app',
          POSTGRES_USER: 'postgres',
        },
      })
    )

    expect(handler.type).toBe('upsert-env')
    expect(result.id).toMatch(/^upsert-env-\d+$/)
    expect(result).toMatchObject({
      type: 'upsert-env',
      target: '/target/.env',
      values: {
        DATABASE_URL: 'postgresql://localhost:5432/app',
        POSTGRES_USER: 'postgres',
      },
      origin: { type: 'feature', slug: 'auth' },
      description: 'build upsert-env',
    })
  })
})

function createBuildContext(
  operation: UpsertEnvManifestOperation
): ManifestOperationBuildContext<UpsertEnvManifestOperation> {
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
