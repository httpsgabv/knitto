import type { AstNestAddBootstrapMethodCallManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AstNestAddBootstrapMethodCallManifestOperationHandler } from './ast-nest-add-bootstrap-method-call-manifest-operation.handler'

describe('AstNestAddBootstrapMethodCallManifestOperationHandler', () => {
  it('builds an ast.nest.add-bootstrap-method-call operation', () => {
    const handler = new AstNestAddBootstrapMethodCallManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'ast.nest.add-bootstrap-method-call',
        target: 'src/main.ts',
        receiver: {
          kind: 'member',
          object: 'services',
          property: 'logger',
        },
        method: 'flush',
        arguments: [{ kind: 'identifier', name: 'context' }],
      })
    )

    expect(handler.type).toBe('ast.nest.add-bootstrap-method-call')
    expect(result.id).toMatch(/^ast-nest-add-bootstrap-method-call-\d+$/)
    expect(result).toMatchObject({
      type: 'ast.nest.add-bootstrap-method-call',
      target: '/target/src/main.ts',
      receiver: {
        kind: 'member',
        object: 'services',
        property: 'logger',
      },
      method: 'flush',
      arguments: [{ kind: 'identifier', name: 'context' }],
      origin: { type: 'feature', slug: 'auth' },
      description: 'build ast.nest.add-bootstrap-method-call',
    })
  })
})

function createBuildContext(
  operation: AstNestAddBootstrapMethodCallManifestOperation
): ManifestOperationBuildContext<AstNestAddBootstrapMethodCallManifestOperation> {
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
