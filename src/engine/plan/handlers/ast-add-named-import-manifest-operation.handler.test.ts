import type { AstAddNamedImportManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AstAddNamedImportManifestOperationHandler } from './ast-add-named-import-manifest-operation.handler'

describe('AstAddNamedImportManifestOperationHandler', () => {
  it('builds an ast.add-named-import operation', () => {
    const handler = new AstAddNamedImportManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'ast.add-named-import',
        target: 'src/app.module.ts',
        named: 'ConfigModule',
        from: '@nestjs/config',
      })
    )

    expect(handler.type).toBe('ast.add-named-import')
    expect(result.id).toMatch(/^ast-add-named-import-\d+$/)
    expect(result).toMatchObject({
      type: 'ast.add-named-import',
      target: '/target/src/app.module.ts',
      named: 'ConfigModule',
      from: '@nestjs/config',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build ast.add-named-import',
    })
  })
})

function createBuildContext(
  operation: AstAddNamedImportManifestOperation
): ManifestOperationBuildContext<AstAddNamedImportManifestOperation> {
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
