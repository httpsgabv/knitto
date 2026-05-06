import type { AstNestAddModuleImportManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AstNestAddModuleImportManifestOperationHandler } from './ast-nest-add-module-import-manifest-operation.handler'

describe('AstNestAddModuleImportManifestOperationHandler', () => {
  it('builds an ast.nest.add-module-import operation', () => {
    const handler = new AstNestAddModuleImportManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'ast.nest.add-module-import',
        target: 'src/app.module.ts',
        import: {
          named: 'AuthModule',
          from: './auth/auth.module',
        },
        moduleName: 'AppModule',
      })
    )

    expect(handler.type).toBe('ast.nest.add-module-import')
    expect(result.id).toMatch(/^ast-nest-add-module-import-\d+$/)
    expect(result).toMatchObject({
      type: 'ast.nest.add-module-import',
      target: '/target/src/app.module.ts',
      namedImport: {
        name: 'AuthModule',
        from: './auth/auth.module',
      },
      moduleName: 'AppModule',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build ast.nest.add-module-import',
    })
  })
})

function createBuildContext(
  operation: AstNestAddModuleImportManifestOperation
): ManifestOperationBuildContext<AstNestAddModuleImportManifestOperation> {
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
