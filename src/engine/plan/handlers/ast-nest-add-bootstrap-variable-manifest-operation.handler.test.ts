import type { AstNestAddBootstrapVariableManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AstNestAddBootstrapVariableManifestOperationHandler } from './ast-nest-add-bootstrap-variable-manifest-operation.handler'

describe('AstNestAddBootstrapVariableManifestOperationHandler', () => {
  it('builds an ast.nest.add-bootstrap-variable operation', () => {
    const handler = new AstNestAddBootstrapVariableManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'ast.nest.add-bootstrap-variable',
        target: 'src/main.ts',
        declarationKind: 'const',
        name: 'xpto',
        initializer: {
          kind: 'new',
          constructor: {
            kind: 'identifier',
            name: 'Xpto',
          },
          arguments: [{ kind: 'identifier', name: 'params' }],
        },
      })
    )

    expect(handler.type).toBe('ast.nest.add-bootstrap-variable')
    expect(result.id).toMatch(/^ast-nest-add-bootstrap-variable-\d+$/)
    expect(result).toMatchObject({
      type: 'ast.nest.add-bootstrap-variable',
      target: '/target/src/main.ts',
      declarationKind: 'const',
      name: 'xpto',
      initializer: {
        kind: 'new',
        constructor: {
          kind: 'identifier',
          name: 'Xpto',
        },
        arguments: [{ kind: 'identifier', name: 'params' }],
      },
      origin: { type: 'feature', slug: 'auth' },
      description: 'build ast.nest.add-bootstrap-variable',
    })
  })
})

function createBuildContext(
  operation: AstNestAddBootstrapVariableManifestOperation
): ManifestOperationBuildContext<AstNestAddBootstrapVariableManifestOperation> {
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
