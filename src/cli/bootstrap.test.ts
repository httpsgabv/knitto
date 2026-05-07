import { describe, expect, it, vi } from 'vitest'
import { OfficialCatalog } from '@catalog/official-catalog'
import { CreateProjectUseCase } from '@engine/create-project/create-project.use-case'
import { FeatureResolver } from '@engine/plan/feature-resolver'
import { createApp } from './bootstrap'

describe('createApp', () => {
  it('returns the wired app services', async () => {
    const app = await createApp()

    expect(app.catalog).toBeInstanceOf(OfficialCatalog)
    expect(app.createProjectUseCase).toBeInstanceOf(CreateProjectUseCase)
  })

  it('wires the catalog into CreateProjectUseCase and FeatureResolver', async () => {
    const app = await createApp()
    const createProjectUseCase = app.createProjectUseCase as unknown as {
      catalog: OfficialCatalog
      featureResolver: {
        catalog: OfficialCatalog
      }
    }

    expect(createProjectUseCase.catalog).toBe(app.catalog)
    expect(createProjectUseCase.featureResolver).toBeInstanceOf(FeatureResolver)
    expect(createProjectUseCase.featureResolver.catalog).toBe(app.catalog)
  })

  it('awaits the catalog loader and wires the same catalog into the app services', async () => {
    const catalog = new OfficialCatalog(
      [
        {
          slug: 'remote-kit',
          name: 'Remote Kit',
          description: 'Loaded remotely',
          source: {
            type: 'github',
            repo: 'httpsgabv/knitto-templates',
            path: '/kits/',
            name: 'remote-kit',
          },
          compatibleFeatures: [],
        },
      ],
      []
    )

    const app = await createApp({
      loadCatalog: vi.fn().mockResolvedValue(catalog),
    })

    expect(app.catalog).toBe(catalog)
    expect(app.catalog.getKit('remote-kit').description).toBe('Loaded remotely')
  })
})
