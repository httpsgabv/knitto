import { Errors } from '@core/errors/errors'
import type { GenerationOperation } from '@core/generation/operation'
import type { TemplateFile } from '@core/template/template-file'
import { describe, expect, it, vi } from 'vitest'
import type { ManifestOperationHandler } from './manifest-operation-handler'
import { ManifestOperationBuilder } from './manifest-operation-builder'
import { ManifestOperationHandlerRegistry } from './manifest-operation-handler-registry'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'

describe('ManifestOperationBuilder', () => {
  const origin = { type: 'feature' as const, slug: 'auth' }
  const templateDir = '/templates/auth'
  const targetDir = '/projects/demo'
  const manifestName = 'Authentication'
  const templateFiles: TemplateFile[] = [
    {
      absolutePath: '/templates/auth/package.json',
      relativePath: 'package.json',
    },
    {
      absolutePath: '/templates/auth/.env.example',
      relativePath: '.env.example',
    },
    {
      absolutePath: '/templates/auth/README.knitto.md',
      relativePath: 'README.knitto.md',
    },
    {
      absolutePath: '/templates/auth/src/auth.ts',
      relativePath: 'src/auth.ts',
    },
  ]

  const createBuilder = () =>
    new ManifestOperationBuilder(
      new ManifestOperationHandlerRegistry({
        'copy-file': {
          type: 'copy-file',
          build: ({ operation, description, origin, resolveSource, resolveTarget }) => ({
            id: 'copy-1',
            type: 'copy-file',
            source: resolveSource(operation.source),
            target: resolveTarget(operation.target),
            overwrite: operation.overwrite,
            renderVariables: operation.renderVariables,
            origin,
            description,
          }),
        },
        'merge-package-json': {
          type: 'merge-package-json',
          build: ({ operation, description, origin, resolveSource, resolveTarget }) => ({
            id: 'merge-package-json-1',
            type: 'merge-package-json',
            source: resolveSource(operation.source),
            target: resolveTarget(operation.target),
            strategy: operation.strategy,
            origin,
            description,
          }),
        },
        'append-env': {
          type: 'append-env',
          build: ({ operation, description, origin, resolveSource, resolveTarget }) => ({
            id: 'append-env-1',
            type: 'append-env',
            source: resolveSource(operation.source),
            target: resolveTarget(operation.target),
            strategy: operation.strategy,
            origin,
            description,
          }),
        },
        'append-readme': {
          type: 'append-readme',
          build: ({ operation, description, origin, resolveSource, resolveTarget }) => ({
            id: 'append-readme-1',
            type: 'append-readme',
            source: resolveSource(operation.source),
            target: resolveTarget(operation.target),
            heading: operation.heading,
            origin,
            description,
          }),
        },
        'ast.add-named-import': {
          type: 'ast.add-named-import',
          build: ({ operation, description, origin, resolveTarget }) => ({
            id: 'ast-add-named-import-1',
            type: 'ast.add-named-import',
            target: resolveTarget(operation.target),
            named: operation.named,
            from: operation.from,
            origin,
            description,
          }),
        },
        'ast.nest.add-module-import': {
          type: 'ast.nest.add-module-import',
          build: ({ operation, description, origin, resolveTarget }) => ({
            id: 'ast-nest-add-module-import-1',
            type: 'ast.nest.add-module-import',
            target: resolveTarget(operation.target),
            namedImport: {
              name: operation.import.named,
              from: operation.import.from,
            },
            moduleName: operation.moduleName,
            origin,
            description,
          }),
        },
        'ast.nest.add-bootstrap-call': {
          type: 'ast.nest.add-bootstrap-call',
          build: ({ operation, description, origin, resolveTarget }) => ({
            id: 'ast-nest-add-bootstrap-call-1',
            type: 'ast.nest.add-bootstrap-call',
            target: resolveTarget(operation.target),
            appVar: operation.appVar,
            call: operation.call,
            origin,
            description,
          }),
        },
      }),
      new ManifestOperationPathResolver()
    )

  const builder = createBuilder()

  it('delegates concrete operations to the registered handler with shared context', () => {
    const build = vi.fn().mockReturnValue({ type: 'copy-file' } as GenerationOperation)
    const handler = {
      type: 'copy-file',
      build,
    } satisfies ManifestOperationHandler<
      Extract<Parameters<typeof builder.build>[0]['operation'], { type: 'copy-file' }>
    >
    const registry = {
      get: vi.fn().mockReturnValue(handler),
    }
    const delegatingBuilder = new ManifestOperationBuilder(
      registry as never,
      new ManifestOperationPathResolver()
    )

    const operation = {
      type: 'copy-file' as const,
      source: 'src/auth.ts',
      target: 'src/auth.ts',
      overwrite: false,
      renderVariables: true,
    }

    const result = delegatingBuilder.build({
      operation,
      templateDir,
      targetDir,
      origin,
    })

    expect(registry.get).toHaveBeenCalledWith('copy-file')
    expect(build).toHaveBeenCalledWith(
      expect.objectContaining({
        operation,
        description: 'Apply copy-file from auth',
        origin,
      })
    )
    expect(result).toEqual({ type: 'copy-file' })
  })

  it('builds merge-package-json operations', () => {
    const operation = builder.build({
      operation: {
        type: 'merge-package-json',
        source: 'files/package.json',
        target: 'package.json',
        strategy: 'safe-merge',
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toMatchObject({
      type: 'merge-package-json',
      source: '/templates/auth/files/package.json',
      target: '/projects/demo/package.json',
      strategy: 'safe-merge',
      origin,
      description: 'Apply merge-package-json from auth',
    })
    expect(operation.id).toMatch(/^merge-package-json-\d+$/)
  })

  it('builds append-env operations', () => {
    const operation = builder.build({
      operation: {
        type: 'append-env',
        source: 'files/.env.example',
        target: '.env.example',
        strategy: 'append-missing',
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toMatchObject({
      type: 'append-env',
      source: '/templates/auth/files/.env.example',
      target: '/projects/demo/.env.example',
      strategy: 'append-missing',
      origin,
      description: 'Apply append-env from auth',
    })
    expect(operation.id).toMatch(/^append-env-\d+$/)
  })

  it('builds append-readme operations', () => {
    const operation = builder.build({
      operation: {
        type: 'append-readme',
        source: 'docs/README.auth.md',
        target: 'README.md',
        heading: 'Authentication',
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toMatchObject({
      type: 'append-readme',
      source: '/templates/auth/docs/README.auth.md',
      target: '/projects/demo/README.md',
      heading: 'Authentication',
      origin,
      description: 'Apply append-readme from auth',
    })
    expect(operation.id).toMatch(/^append-readme-\d+$/)
  })

  it('builds copy-file operations', () => {
    const operation = builder.build({
      operation: {
        type: 'copy-file',
        source: 'src/auth.ts',
        target: 'src/auth.ts',
        overwrite: false,
        renderVariables: true,
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toMatchObject({
      type: 'copy-file',
      source: '/templates/auth/src/auth.ts',
      target: '/projects/demo/src/auth.ts',
      overwrite: false,
      renderVariables: true,
      origin,
      description: 'Apply copy-file from auth',
    })
    expect(operation.id).toMatch(/^copy-\d+$/)
  })

  it('builds ast.add-named-import operations with absolute targets', () => {
    const operation = builder.build({
      operation: {
        type: 'ast.add-named-import',
        target: 'src/main.ts',
        named: 'setupAuth',
        from: './auth/setup-auth',
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toEqual({
      id: expect.stringMatching(/^ast-add-named-import-\d+$/),
      type: 'ast.add-named-import',
      target: '/projects/demo/src/main.ts',
      named: 'setupAuth',
      from: './auth/setup-auth',
      origin,
      description: 'Apply ast.add-named-import from auth',
    })
  })

  it('builds ast.nest.add-module-import operations with the approved internal shape', () => {
    const operation = builder.build({
      operation: {
        type: 'ast.nest.add-module-import',
        target: 'src/app.module.ts',
        import: {
          named: 'AuthModule',
          from: './auth/auth.module',
        },
        moduleName: 'AppModule',
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toEqual({
      id: expect.stringMatching(/^ast-nest-add-module-import-\d+$/),
      type: 'ast.nest.add-module-import',
      target: '/projects/demo/src/app.module.ts',
      namedImport: {
        name: 'AuthModule',
        from: './auth/auth.module',
      },
      moduleName: 'AppModule',
      origin,
      description: 'Apply ast.nest.add-module-import from auth',
    })
  })

  it('builds ast.nest.add-bootstrap-call operations with structured bootstrap expressions', () => {
    const operation = builder.build({
      operation: {
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
      },
      templateDir,
      targetDir,
      origin,
    })

    expect(operation).toEqual({
      id: expect.stringMatching(/^ast-nest-add-bootstrap-call-\d+$/),
      type: 'ast.nest.add-bootstrap-call',
      target: '/projects/demo/src/main.ts',
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
      origin,
      description: 'Apply ast.nest.add-bootstrap-call from auth',
    })
  })

  it('expands add-all using legacy-aware operation types', () => {
    const operations = builder.buildAll({
      operation: {
        type: 'add-all',
      },
      templateDir,
      targetDir,
      origin,
      templateFiles,
      manifestName,
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'merge-package-json',
        source: '/templates/auth/package.json',
        target: '/projects/demo/package.json',
        strategy: 'safe-merge',
      }),
      expect.objectContaining({
        type: 'append-env',
        source: '/templates/auth/.env.example',
        target: '/projects/demo/.env.example',
        strategy: 'append-missing',
      }),
      expect.objectContaining({
        type: 'append-readme',
        source: '/templates/auth/README.knitto.md',
        target: '/projects/demo/README.md',
        heading: 'Authentication',
      }),
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/auth/src/auth.ts',
        target: '/projects/demo/src/auth.ts',
        overwrite: false,
        renderVariables: true,
      }),
    ])
  })

  it('skips add-all files that are handled by explicit operations', () => {
    const operations = builder.buildAll({
      operation: {
        type: 'add-all',
      },
      templateDir,
      targetDir,
      origin,
      templateFiles,
      manifestName,
      explicitSources: new Set(['package.json']),
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'append-env',
        source: '/templates/auth/.env.example',
      }),
      expect.objectContaining({
        type: 'append-readme',
        source: '/templates/auth/README.knitto.md',
      }),
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/auth/src/auth.ts',
      }),
    ])
  })

  it('returns no operations when add-all has no template files', () => {
    expect(
      builder.buildAll({
        operation: { type: 'add-all' },
        templateDir,
        targetDir,
        origin,
      })
    ).toEqual([])
  })

  it('uses the origin slug when add-all appends a README without a manifest name', () => {
    const operations = builder.buildAll({
      operation: { type: 'add-all' },
      templateDir,
      targetDir,
      origin,
      templateFiles: [
        {
          absolutePath: '/templates/auth/README.knitto.md',
          relativePath: 'README.knitto.md',
        },
      ],
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'append-readme',
        heading: 'auth',
      }),
    ])
  })

  it('rejects building add-all without expanding it first', () => {
    expect(() =>
      builder.build({
        operation: { type: 'add-all' },
        templateDir,
        targetDir,
        origin,
      })
    ).toThrow('add-all must be expanded before building operations')
  })

  it('fails when no handler is registered for a concrete operation type', () => {
    const builderWithoutHandlers = new ManifestOperationBuilder(
      {
        get: vi.fn().mockReturnValue(undefined),
      } as never,
      new ManifestOperationPathResolver()
    )

    expect(() =>
      builderWithoutHandlers.build({
        operation: {
          type: 'copy-file',
          source: 'src/auth.ts',
          target: 'src/auth.ts',
          overwrite: false,
          renderVariables: true,
        },
        templateDir,
        targetDir,
        origin,
      })
    ).toThrow('No handler registered for manifest operation type: copy-file')
  })

  it('rejects manifest source paths that escape the template root', () => {
    expect(() =>
      builder.build({
        operation: {
          type: 'copy-file',
          source: '../secrets.env',
          target: 'src/auth.ts',
          overwrite: false,
          renderVariables: true,
        },
        templateDir,
        targetDir,
        origin,
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_MANIFEST_OPERATION_PATH,
        message: 'Manifest operation source escapes template root: ../secrets.env',
      })
    )
  })

  it('rejects manifest target paths that escape the target directory', () => {
    expect(() =>
      builder.build({
        operation: {
          type: 'append-env',
          source: 'files/.env.example',
          target: '../outside/.env.example',
          strategy: 'append-missing',
        },
        templateDir,
        targetDir,
        origin,
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_MANIFEST_OPERATION_PATH,
        message:
          'Manifest operation target escapes target directory: ../outside/.env.example',
      })
    )
  })
})
