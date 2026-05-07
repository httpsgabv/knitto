import type {
  AstNestAddBootstrapCallManifestOperation,
  AstNestAddBootstrapMethodCallManifestOperation,
  AstNestAddBootstrapVariableManifestOperation,
} from './manifest-operation'
import {
  AstNestAddBootstrapCallManifestOperationSchema,
  AstNestAddBootstrapMethodCallManifestOperationSchema,
  AstNestAddBootstrapVariableManifestOperationSchema,
} from './manifest-operation.schema'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { FeatureManifestSchema } from './feature-manifest.schema'
import { KitManifestSchema } from './kit-manifest.schema'
import { ManifestOperationSchema } from './manifest-operation.schema'
import { ManifestSchema } from './manifest.schema'

describe('ManifestSchema', () => {
  it('parses a valid feature manifest', () => {
    const result = ManifestSchema.parse({
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Adds auth support.',
      supports: ['react'],
      requires: ['base'],
      conflictsWith: ['legacy-auth'],
      files: {
        include: ['src/**'],
        exclude: ['src/**/*.test.ts'],
      },
      operations: [
        {
          type: 'copy-file',
          source: 'templates/auth.ts',
          target: 'src/auth.ts',
          overwrite: true,
        },
        {
          type: 'ast.add-named-import',
          target: 'src/main.ts',
          named: 'setupAuth',
          from: './auth',
        },
      ],
    })

    expect(result.type).toBe('feature')
    expect(result.supports).toEqual(['react'])
    expect(result.files).toEqual({
      include: ['src/**'],
      exclude: ['src/**/*.test.ts'],
    })
    expect(result.operations).toHaveLength(2)
    expect(result.operations[0]).toEqual({
      type: 'copy-file',
      source: 'templates/auth.ts',
      target: 'src/auth.ts',
      overwrite: true,
      renderVariables: true,
    })
    expect(result.operations[1]).toEqual({
      type: 'ast.add-named-import',
      target: 'src/main.ts',
      named: 'setupAuth',
      from: './auth',
    })
  })

  it('parses a valid kit manifest', () => {
    const result = KitManifestSchema.parse({
      schemaVersion: 1,
      type: 'kit',
      slug: 'next-base',
      name: 'Next Base',
      description: 'Base Next.js kit.',
      supports: [],
      requires: [],
      conflictsWith: [],
      files: {
        include: ['src/**'],
      },
    })

    expect(result.type).toBe('kit')
    expect(result.files).toEqual({
      include: ['src/**'],
      exclude: [],
    })
    expect(result.operations).toEqual([])
  })

  it('fails for an invalid operation type', () => {
    const result = ManifestSchema.safeParse({
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
      name: 'Base',
      description: 'Base kit.',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'delete-file',
          target: 'src/old.ts',
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('fails when a feature manifest has no supports', () => {
    const result = FeatureManifestSchema.safeParse({
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Adds auth support.',
      supports: [],
      requires: [],
      conflictsWith: [],
    })

    expect(result.success).toBe(false)
  })

  it('fails when required compatibility arrays are missing', () => {
    const result = KitManifestSchema.safeParse({
      schemaVersion: 1,
      type: 'kit',
      slug: 'next-base',
      name: 'Next Base',
      description: 'Base Next.js kit.',
    })

    expect(result.success).toBe(false)
  })

  it('validates manifest operation schemas', () => {
    const operations = [
      {
        type: 'copy-file',
        source: 'templates/.env.example',
        target: '.env.example',
        overwrite: false,
      },
      {
        type: 'merge-package-json',
        source: 'template/package.json',
      },
      {
        type: 'append-env',
        source: 'template/.env',
      },
      {
        type: 'upsert-env',
        target: '.env',
        values: {
          DATABASE_URL: 'postgresql://localhost:5432/app',
          POSTGRES_USER: 'postgres',
        },
      },
      {
        type: 'append-lines',
        target: '.gitignore',
        lines: ['/src/generated/prisma', '.env'],
      },
      {
        type: 'append-readme',
        source: 'template/README.snippet.md',
        heading: 'Setup',
      },
      {
        type: 'add-all',
      },
      {
        type: 'ast.add-named-import',
        target: 'src/main.ts',
        named: 'setup',
        from: './setup',
      },
      {
        type: 'ast.nest.add-module-import',
        target: 'src/app.module.ts',
        import: {
          named: 'AuthModule',
          from: './auth/auth.module',
        },
        moduleName: 'AuthModule',
      },
      {
        type: 'ast.nest.add-bootstrap-call',
        target: 'src/main.ts',
        appVar: 'app',
        call: {
          method: 'enableCors',
          arguments: [
            {
              kind: 'object',
              properties: [
                {
                  key: 'origin',
                  value: { kind: 'string', value: '*' },
                },
                {
                  key: 'credentials',
                  value: { kind: 'boolean', value: true },
                },
              ],
            },
          ],
        },
      },
    ]

    const result = operations.map((operation) =>
      ManifestOperationSchema.parse(operation)
    )

    expect(result).toHaveLength(10)
    expect(result[0]).toEqual({
      type: 'copy-file',
      source: 'templates/.env.example',
      target: '.env.example',
      overwrite: false,
      renderVariables: true,
    })
    expect(result[1]).toEqual({
      type: 'merge-package-json',
      source: 'template/package.json',
      target: 'package.json',
      strategy: 'safe-merge',
    })
    expect(result[2]).toEqual({
      type: 'append-env',
      source: 'template/.env',
      target: '.env.example',
      strategy: 'append-missing',
    })
    expect(result[3]).toEqual({
      type: 'upsert-env',
      target: '.env',
      values: {
        DATABASE_URL: 'postgresql://localhost:5432/app',
        POSTGRES_USER: 'postgres',
      },
    })
    expect(result[4]).toEqual({
      type: 'append-lines',
      target: '.gitignore',
      lines: ['/src/generated/prisma', '.env'],
    })
    expect(result[5]).toEqual({
      type: 'append-readme',
      source: 'template/README.snippet.md',
      target: 'README.md',
      heading: 'Setup',
    })
    expect(result[6]).toEqual({
      type: 'add-all',
    })
    expect(result[7]).toEqual({
      type: 'ast.add-named-import',
      target: 'src/main.ts',
      named: 'setup',
      from: './setup',
    })
    expect(result[8]).toEqual({
      type: 'ast.nest.add-module-import',
      target: 'src/app.module.ts',
      import: {
        named: 'AuthModule',
        from: './auth/auth.module',
      },
      moduleName: 'AuthModule',
    })
    expect(result[9]).toEqual({
      type: 'ast.nest.add-bootstrap-call',
      target: 'src/main.ts',
      appVar: 'app',
      call: {
        method: 'enableCors',
        arguments: [
          {
            kind: 'object',
            properties: [
              {
                key: 'origin',
                value: { kind: 'string', value: '*' },
              },
              {
                key: 'credentials',
                value: { kind: 'boolean', value: true },
              },
            ],
          },
        ],
      },
    })
  })

  it('rejects unsupported bootstrap expression kinds', () => {
    const result = ManifestOperationSchema.safeParse({
      type: 'ast.nest.add-bootstrap-call',
      target: 'src/main.ts',
      appVar: 'app',
      call: {
        method: 'use',
        arguments: [
          {
            kind: 'template',
            value: 'raw code',
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it('parses ast.nest.add-bootstrap-variable operations with const initializers', () => {
    const result = ManifestOperationSchema.parse({
      type: 'ast.nest.add-bootstrap-variable',
      target: 'src/main.ts',
      declarationKind: 'const',
      name: 'xpto',
      initializer: {
        kind: 'new',
        constructor: { kind: 'identifier', name: 'Xpto' },
        arguments: [{ kind: 'identifier', name: 'params' }],
      },
    })

    expect(result).toEqual({
      type: 'ast.nest.add-bootstrap-variable',
      target: 'src/main.ts',
      declarationKind: 'const',
      name: 'xpto',
      initializer: {
        kind: 'new',
        constructor: { kind: 'identifier', name: 'Xpto' },
        arguments: [{ kind: 'identifier', name: 'params' }],
      },
    })
  })

  it('rejects invalid bootstrap variable identifiers', () => {
    const result = ManifestOperationSchema.safeParse({
      type: 'ast.nest.add-bootstrap-variable',
      target: 'src/main.ts',
      declarationKind: 'let',
      name: 'bad-name',
      initializer: { kind: 'number', value: 1 },
    })

    expect(result.success).toBe(false)
  })

  it('parses ast.nest.add-bootstrap-method-call operations', () => {
    expect(
      ManifestOperationSchema.parse({
        type: 'ast.nest.add-bootstrap-method-call',
        target: 'src/main.ts',
        receiver: {
          kind: 'identifier',
          name: 'xpto',
        },
        method: 'configure',
        arguments: [
          { kind: 'string', value: 'abc' },
          {
            kind: 'object',
            properties: [
              { key: 'enabled', value: { kind: 'boolean', value: true } },
            ],
          },
        ],
      })
    ).toEqual({
      type: 'ast.nest.add-bootstrap-method-call',
      target: 'src/main.ts',
      receiver: {
        kind: 'identifier',
        name: 'xpto',
      },
      method: 'configure',
      arguments: [
        { kind: 'string', value: 'abc' },
        {
          kind: 'object',
          properties: [
            { key: 'enabled', value: { kind: 'boolean', value: true } },
          ],
        },
      ],
    })
  })

  it('rejects invalid bootstrap method identifiers', () => {
    const result = ManifestOperationSchema.safeParse({
      type: 'ast.nest.add-bootstrap-method-call',
      target: 'src/main.ts',
      receiver: { kind: 'identifier', name: 'xpto' },
      method: 'bad-name',
      arguments: [],
    })

    expect(result.success).toBe(false)
  })

  it('preserves concrete bootstrap expression types for parsed operations', () => {
    const result = AstNestAddBootstrapCallManifestOperationSchema.parse({
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

    expectTypeOf(
      result
    ).toEqualTypeOf<AstNestAddBootstrapCallManifestOperation>()
  })

  it('rejects invalid identifier-like bootstrap fields at schema validation time', () => {
    const result = AstNestAddBootstrapCallManifestOperationSchema.safeParse({
      type: 'ast.nest.add-bootstrap-call',
      target: 'src/main.ts',
      appVar: 'app-var',
      call: {
        method: 'use-logger',
        arguments: [
          {
            kind: 'member',
            object: 'bad.object',
            property: 'good',
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it('preserves concrete bootstrap variable types for parsed operations', () => {
    const result = AstNestAddBootstrapVariableManifestOperationSchema.parse({
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

    expectTypeOf(
      result
    ).toEqualTypeOf<AstNestAddBootstrapVariableManifestOperation>()
  })

  it('preserves concrete bootstrap method call types for parsed operations', () => {
    const result = AstNestAddBootstrapMethodCallManifestOperationSchema.parse({
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

    expectTypeOf(
      result
    ).toEqualTypeOf<AstNestAddBootstrapMethodCallManifestOperation>()
  })
})
