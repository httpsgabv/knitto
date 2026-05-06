import type { AstNestAddBootstrapCallManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AstNestAddBootstrapCallManifestOperationHandler } from './ast-nest-add-bootstrap-call-manifest-operation.handler'

describe('AstNestAddBootstrapCallManifestOperationHandler', () => {
  it('builds an ast.nest.add-bootstrap-call operation', () => {
    const handler = new AstNestAddBootstrapCallManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'ast.nest.add-bootstrap-call',
        target: 'src/main.ts',
        appVar: 'app',
        call: {
          method: 'useGlobalPipes',
          arguments: [
            {
              kind: 'new',
              constructor: {
                kind: 'identifier',
                name: 'ValidationPipe',
              },
              arguments: [
                {
                  kind: 'object',
                  properties: [
                    {
                      key: 'transform',
                      value: { kind: 'boolean', value: true },
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    )

    expect(handler.type).toBe('ast.nest.add-bootstrap-call')
    expect(result.id).toMatch(/^ast-nest-add-bootstrap-call-\d+$/)
    expect(result).toMatchObject({
      type: 'ast.nest.add-bootstrap-call',
      target: '/target/src/main.ts',
      appVar: 'app',
      call: {
        method: 'useGlobalPipes',
        arguments: [
          {
            kind: 'new',
            constructor: {
              kind: 'identifier',
              name: 'ValidationPipe',
            },
            arguments: [
              {
                kind: 'object',
                properties: [
                  {
                    key: 'transform',
                    value: { kind: 'boolean', value: true },
                  },
                ],
              },
            ],
          },
        ],
      },
      origin: { type: 'feature', slug: 'auth' },
      description: 'build ast.nest.add-bootstrap-call',
    })
  })
})

function createBuildContext(
  operation: AstNestAddBootstrapCallManifestOperation
): ManifestOperationBuildContext<AstNestAddBootstrapCallManifestOperation> {
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
