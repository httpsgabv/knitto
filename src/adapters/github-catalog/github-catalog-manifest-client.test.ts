import { describe, expect, it, vi } from 'vitest'
import { GithubCatalogManifestClient } from './github-catalog-manifest-client'

const encodedCatalog = Buffer.from(
  JSON.stringify({
    kits: [
      {
        slug: 'nestjs',
        name: 'NestJS',
        description: 'A NestJS starter for building modular APIs.',
        source: {
          type: 'github',
          repo: 'httpsgabv/knitto-templates',
          path: '/kits/',
          name: 'nest-api',
        },
        compatibleFeatures: ['pino-logging'],
      },
    ],
    features: [
      {
        slug: 'pino-logging',
        name: 'Pino Logging',
        description: 'Add a basic Pino logging setup.',
        source: {
          type: 'github',
          repo: 'httpsgabv/knitto-templates',
          path: '/features/',
          name: 'feature-pino',
        },
        supports: ['nestjs'],
        requires: [],
        conflictsWith: [],
      },
    ],
  })
).toString('base64')

describe('GithubCatalogManifestClient', () => {
  it('loads and validates knitto-catalog.json from the Github contents API', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        content: encodedCatalog,
        encoding: 'base64',
      }),
    })
    const client = new GithubCatalogManifestClient(fetchFn as typeof fetch)

    const result = await client.load('httpsgabv/knitto-templates')

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.github.com/repos/httpsgabv/knitto-templates/contents/knitto-catalog.json'
    )
    expect(result.kits[0]?.slug).toBe('nestjs')
    expect(result.features[0]?.slug).toBe('pino-logging')
  })

  it('throws when GitHub returns a non-success response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    const client = new GithubCatalogManifestClient(fetchFn as typeof fetch)

    await expect(client.load('httpsgabv/knitto-templates')).rejects.toThrow(
      'Failed to load remote catalog: HTTP 404'
    )
  })
})
