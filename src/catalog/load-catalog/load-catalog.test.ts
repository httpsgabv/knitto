import { describe, expect, it, vi } from 'vitest'
import { loadCatalog } from './load-catalog'

const remoteData = {
  kits: [
    {
      slug: 'nestjs',
      name: 'NestJS',
      description: 'Remote kit',
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
      description: 'Remote feature',
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
}

describe('loadCatalog', () => {
  it('returns an OfficialCatalog built from remote data when the fetch succeeds', async () => {
    const catalog = await loadCatalog({
      remoteCatalogClient: { load: vi.fn().mockResolvedValue(remoteData) },
    })

    expect(catalog.getKit('nestjs').description).toBe('Remote kit')
    expect(catalog.getFeature('pino-logging').description).toBe(
      'Remote feature'
    )
  })

  it('falls back to bundled data and reports the reason when the fetch fails', async () => {
    const onFallback = vi.fn()
    const catalog = await loadCatalog({
      remoteCatalogClient: {
        load: vi.fn().mockRejectedValue(new Error('HTTP 404')),
      },
      onFallback,
    })

    expect(onFallback).toHaveBeenCalledWith(expect.any(Error))
    expect(catalog.listKits().length).toBeGreaterThan(0)
    expect(catalog.listFeatures().length).toBeGreaterThan(0)
  })

  it('falls back when the remote payload is invalid for CatalogSchema', async () => {
    const onFallback = vi.fn()

    const catalog = await loadCatalog({
      remoteCatalogClient: {
        load: vi.fn().mockRejectedValue(new Error('invalid remote catalog')),
      },
      onFallback,
    })

    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(catalog.listKits().map((kit) => kit.slug)).toContain('nestjs')
  })
})
