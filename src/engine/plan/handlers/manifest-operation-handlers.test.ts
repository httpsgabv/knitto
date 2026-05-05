import type {
  AppendEnvManifestOperation,
  AppendReadmeManifestOperation,
  AstAddNamedImportManifestOperation,
  AstNestAddBootstrapCallManifestOperation,
  AstNestAddModuleImportManifestOperation,
  CopyFileManifestOperation,
  MergePackageJsonManifestOperation,
} from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type {
  ConcreteManifestOperation,
  ManifestOperationBuildContext,
} from '../manifest-operation-build-context'
import { AppendEnvManifestOperationHandler } from './append-env-manifest-operation.handler'
import { AppendReadmeManifestOperationHandler } from './append-readme-manifest-operation.handler'
import { AstAddNamedImportManifestOperationHandler } from './ast-add-named-import-manifest-operation.handler'
import { AstNestAddBootstrapCallManifestOperationHandler } from './ast-nest-add-bootstrap-call-manifest-operation.handler'
import { AstNestAddModuleImportManifestOperationHandler } from './ast-nest-add-module-import-manifest-operation.handler'
import { CopyFileManifestOperationHandler } from './copy-file-manifest-operation.handler'
import { createManifestOperationHandlers } from './create-manifest-operation-handlers'
import { MergePackageJsonManifestOperationHandler } from './merge-package-json-manifest-operation.handler'

function createBuildContext<T extends ConcreteManifestOperation>(
  operation: T
): ManifestOperationBuildContext<T> {
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

describe('manifest operation handlers', () => {
  it('builds copy-file operations', () => {
    const handler = new CopyFileManifestOperationHandler()
    const result = handler.build(
      createBuildContext<CopyFileManifestOperation>({
        type: 'copy-file',
        source: 'template/src/main.ts',
        target: 'src/main.ts',
        overwrite: true,
        renderVariables: false,
      })
    )

    expect(handler.type).toBe('copy-file')
    expect(result.id).toMatch(/^copy-\d+$/)
    expect(result).toMatchObject({
      type: 'copy-file',
      source: '/template/template/src/main.ts',
      target: '/target/src/main.ts',
      overwrite: true,
      renderVariables: false,
      origin: { type: 'feature', slug: 'auth' },
      description: 'build copy-file',
    })
  })

  it('builds merge-package-json operations', () => {
    const handler = new MergePackageJsonManifestOperationHandler()
    const result = handler.build(
      createBuildContext<MergePackageJsonManifestOperation>({
        type: 'merge-package-json',
        source: 'package.partial.json',
        target: 'package.json',
        strategy: 'safe-merge',
      })
    )

    expect(handler.type).toBe('merge-package-json')
    expect(result.id).toMatch(/^merge-package-json-\d+$/)
    expect(result).toMatchObject({
      type: 'merge-package-json',
      source: '/template/package.partial.json',
      target: '/target/package.json',
      strategy: 'safe-merge',
      origin: { type: 'feature', slug: 'auth' },
      description: 'build merge-package-json',
    })
  })

  it('builds append-env operations', () => {
    const handler = new AppendEnvManifestOperationHandler()
    const result = handler.build(
      createBuildContext<AppendEnvManifestOperation>({
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

  it('builds append-readme operations', () => {
    const handler = new AppendReadmeManifestOperationHandler()
    const result = handler.build(
      createBuildContext<AppendReadmeManifestOperation>({
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

  it('builds ast.add-named-import operations', () => {
    const handler = new AstAddNamedImportManifestOperationHandler()
    const result = handler.build(
      createBuildContext<AstAddNamedImportManifestOperation>({
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

  it('builds ast.nest.add-module-import operations', () => {
    const handler = new AstNestAddModuleImportManifestOperationHandler()
    const result = handler.build(
      createBuildContext<AstNestAddModuleImportManifestOperation>({
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

  it('builds ast.nest.add-bootstrap-call operations', () => {
    const handler = new AstNestAddBootstrapCallManifestOperationHandler()
    const result = handler.build(
      createBuildContext<AstNestAddBootstrapCallManifestOperation>({
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

  it('registers handlers for every supported manifest operation type', () => {
    const handlers = createManifestOperationHandlers()

    expect(handlers.get('copy-file')?.type).toBe('copy-file')
    expect(handlers.get('merge-package-json')?.type).toBe('merge-package-json')
    expect(handlers.get('append-env')?.type).toBe('append-env')
    expect(handlers.get('append-readme')?.type).toBe('append-readme')
    expect(handlers.get('ast.add-named-import')?.type).toBe(
      'ast.add-named-import'
    )
    expect(handlers.get('ast.nest.add-module-import')?.type).toBe(
      'ast.nest.add-module-import'
    )
    expect(handlers.get('ast.nest.add-bootstrap-call')?.type).toBe(
      'ast.nest.add-bootstrap-call'
    )
  })
})
