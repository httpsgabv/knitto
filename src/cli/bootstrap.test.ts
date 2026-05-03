import { describe, expect, it } from 'vitest'
import { OfficialCatalog } from '@catalog/official-catalog'
import { CreateProjectUseCase } from '@engine/create-project/create-project.use-case'
import { FeatureResolver } from '@engine/plan/feature-resolver'
import { createApp } from './bootstrap'

describe('createApp', () => {
  it('returns the wired app services', () => {
    const app = createApp()

    expect(app.catalog).toBeInstanceOf(OfficialCatalog)
    expect(app.createProjectUseCase).toBeInstanceOf(CreateProjectUseCase)
  })

  it('wires the catalog into CreateProjectUseCase and FeatureResolver', () => {
    const app = createApp()
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
})
