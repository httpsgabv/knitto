import { describe, expect, it } from 'vitest'
import { Errors } from '@core/errors/errors'
import { ManifestLoader } from './manifest-loader'
import { ManifestReader } from './manifest-reader'
import { ManifestValidator } from './manifest-validator'
import { FakeFileSystem } from '@test/adapters/fs/fake-file-system'

describe('ManifestLoader', () => {
  it('returns null when knitto.json does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).resolves.toBeNull()
  })

  it('loads a valid manifest', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/base/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'kit',
        slug: 'base',
        name: 'Base',
        description: 'Base template.',
        supports: [],
        requires: [],
        conflictsWith: [],
        files: {
          include: ['src/**'],
          exclude: ['src/**/*.test.ts'],
        },
      })
    )

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).resolves.toEqual({
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
      name: 'Base',
      description: 'Base template.',
      supports: [],
      requires: [],
      conflictsWith: [],
      files: {
        include: ['src/**'],
        exclude: ['src/**/*.test.ts'],
      },
      operations: [],
    })
  })

  it('throws KnittoError for invalid manifest', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/base/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'kit',
        slug: '',
        name: 'Base',
        description: 'Base template.',
        supports: [],
        requires: [],
        conflictsWith: [],
      })
    )

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.INVALID_TEMPLATE_MANIFEST,
    })
  })

  it('throws KnittoError for malformed knitto.json', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile('/templates/base/knitto.json', '{ invalid json')

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.INVALID_TEMPLATE_MANIFEST,
    })
  })

  it('throws KnittoError for origin type mismatch', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/base/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'feature',
        slug: 'base',
        name: 'Base',
        description: 'Base template.',
        supports: ['react'],
        requires: [],
        conflictsWith: [],
      })
    )

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.INVALID_TEMPLATE_MANIFEST,
      message: 'Template manifest type mismatch: expected kit, received feature',
    })
  })

  it('throws KnittoError for origin slug mismatch', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/base/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'kit',
        slug: 'other',
        name: 'Base',
        description: 'Base template.',
        supports: [],
        requires: [],
        conflictsWith: [],
      })
    )

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.load('/templates/base', { type: 'kit', slug: 'base' })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.INVALID_TEMPLATE_MANIFEST,
      message: 'Template manifest slug mismatch: expected base, received other',
    })
  })

  it('loads many manifests in feature/template order', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/auth/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'feature',
        slug: 'auth',
        name: 'Authentication',
        description: 'Auth feature fixture.',
        supports: ['nestjs'],
        requires: [],
        conflictsWith: [],
      })
    )
    fileSystem.addFile(
      '/templates/billing/knitto.json',
      JSON.stringify({
        schemaVersion: 1,
        type: 'feature',
        slug: 'billing',
        name: 'Billing',
        description: 'Billing feature fixture.',
        supports: ['nestjs'],
        requires: [],
        conflictsWith: [],
      })
    )

    const loader = new ManifestLoader(
      new ManifestReader(fileSystem),
      new ManifestValidator()
    )

    await expect(
      loader.loadMany([
        {
          templateRoot: '/templates/auth',
          expectedOrigin: { type: 'feature', slug: 'auth' },
        },
        {
          templateRoot: '/templates/billing',
          expectedOrigin: { type: 'feature', slug: 'billing' },
        },
      ])
    ).resolves.toEqual([
      expect.objectContaining({ type: 'feature', slug: 'auth' }),
      expect.objectContaining({ type: 'feature', slug: 'billing' }),
    ])
  })

  it('throws when loadMany inputs are misaligned', async () => {
    const loader = new ManifestLoader(
      new ManifestReader(new FakeFileSystem()),
      new ManifestValidator()
    )

    await expect(
      loader.loadMany([
        {
          templateRoot: '/templates/auth',
          expectedOrigin: { type: 'feature', slug: 'auth' },
        },
        {
          templateRoot: '',
          expectedOrigin: { type: 'feature', slug: 'billing' },
        },
      ])
    ).rejects.toThrow('Template roots must be provided for loadMany')
  })
})
