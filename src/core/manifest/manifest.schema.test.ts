import { describe, expect, it } from 'vitest'
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
    ]

    const result = operations.map((operation) => ManifestOperationSchema.parse(operation))

    expect(result).toHaveLength(7)
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
      type: 'append-readme',
      source: 'template/README.snippet.md',
      target: 'README.md',
      heading: 'Setup',
    })
    expect(result[4]).toEqual({
      type: 'add-all',
    })
    expect(result[5]).toEqual({
      type: 'ast.add-named-import',
      target: 'src/main.ts',
      named: 'setup',
      from: './setup',
    })
    expect(result[6]).toEqual({
      type: 'ast.nest.add-module-import',
      target: 'src/app.module.ts',
      import: {
        named: 'AuthModule',
        from: './auth/auth.module',
      },
      moduleName: 'AuthModule',
    })
  })
})
