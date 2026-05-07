import type { AppendLinesManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AppendLinesManifestOperationHandler } from './append-lines-manifest-operation.handler'

describe('AppendLinesManifestOperationHandler', () => {
  it('builds an append-lines operation', () => {
    const handler = new AppendLinesManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'append-lines',
        target: '.gitignore',
        lines: ['/src/generated/prisma', '.env'],
      })
    )

    expect(handler.type).toBe('append-lines')
    expect(result.id).toMatch(/^append-lines-\d+$/)
    expect(result).toMatchObject({
      type: 'append-lines',
      target: '/target/.gitignore',
      lines: ['/src/generated/prisma', '.env'],
      origin: { type: 'feature', slug: 'auth' },
      description: 'build append-lines',
    })
  })
})

function createBuildContext(
  operation: AppendLinesManifestOperation
): ManifestOperationBuildContext<AppendLinesManifestOperation> {
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
