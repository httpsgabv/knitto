import { describe, expect, it, vi } from 'vitest'
import type { Catalog } from '@core/catalog/catalog'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import type { GenerationPlan } from '@core/generation/generation-plan'
import type { Template } from '@core/template/template'
import { CreateProjectUseCase } from './create-project.use-case'

const kitFixture: Kit = {
  name: 'Base Kit',
  slug: 'base-kit',
  description: 'Base kit fixture',
  source: {
    type: 'github',
    repo: 'knitto/base-kit',
    name: 'base-kit',
    path: '.',
  },
  compatibleFeatures: [],
}

const featureFixture: Feature = {
  name: 'Authentication',
  slug: 'auth',
  description: 'Auth feature fixture',
  source: {
    type: 'github',
    repo: 'knitto/auth',
    name: 'auth',
    path: '.',
  },
  supports: [],
  requires: [],
  conflictsWith: [],
}

const kitTemplate: Template = { rootPath: '/templates/base-kit' }
const featureTemplate: Template = { rootPath: '/templates/auth' }

const planFixture: GenerationPlan = {
  project: {
    name: 'demo-app',
    targetDir: '/projects/demo-app',
    packageManager: 'pnpm',
  },
  sources: [],
  variables: { PROJECT_NAME: 'demo-app' },
  operations: [],
  warnings: [],
  conflicts: [],
}

describe('CreateProjectUseCase', () => {
  it('loads kit and feature manifests before planning', async () => {
    const manifestLoader = {
      load: vi
        .fn()
        .mockResolvedValueOnce({
          schemaVersion: 1,
          type: 'kit',
          slug: 'base-kit',
          name: 'Base Kit',
          description: 'Base kit fixture',
          supports: [],
          requires: [],
          conflictsWith: [],
          operations: [],
        } satisfies KitManifest)
        .mockResolvedValueOnce({
          schemaVersion: 1,
          type: 'feature',
          slug: 'auth',
          name: 'Authentication',
          description: 'Auth feature fixture',
          supports: [],
          requires: [],
          conflictsWith: [],
          operations: [],
        } satisfies FeatureManifest),
      loadMany: vi.fn().mockResolvedValue([
        {
          schemaVersion: 1,
          type: 'feature',
          slug: 'auth',
          name: 'Authentication',
          description: 'Auth feature fixture',
          supports: [],
          requires: [],
          conflictsWith: [],
          operations: [],
        } satisfies FeatureManifest,
      ]),
    }

    const generationPlanner = {
      plan: vi.fn().mockResolvedValue(planFixture),
    }

    const useCase = new CreateProjectUseCase(
      { validate: vi.fn((input) => input) } as never,
      { getKit: vi.fn(() => kitFixture) } as unknown as Catalog,
      { resolve: vi.fn(() => [featureFixture]) } as never,
      { check: vi.fn() } as never,
      {
        fetch: vi.fn().mockResolvedValue(kitTemplate),
        fetchMany: vi.fn().mockResolvedValue([featureTemplate]),
      } as never,
      manifestLoader as never,
      generationPlanner as never,
      { compose: vi.fn() } as never,
      { resolve: vi.fn() } as never,
      { init: vi.fn() } as never,
      { pathExists: vi.fn().mockResolvedValue(false) } as never
    )

    await useCase.execute({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kitSlug: 'base-kit',
      featureSlugs: ['auth'],
      installDependencies: false,
      initializeGit: false,
      dryRun: true,
    })

    expect(manifestLoader.load).toHaveBeenCalledWith(kitTemplate.rootPath, {
      type: 'kit',
      slug: 'base-kit',
    })
    expect(manifestLoader.loadMany).toHaveBeenCalledWith([
      {
        templateRoot: featureTemplate.rootPath,
        expectedOrigin: {
          type: 'feature',
          slug: 'auth',
        },
      },
    ])
    expect(generationPlanner.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        kitManifest: expect.objectContaining({ slug: 'base-kit' }),
        featureManifests: [expect.objectContaining({ slug: 'auth' })],
      })
    )
  })

  it('keeps planning when manifests do not exist', async () => {
    const manifestLoader = {
      load: vi.fn().mockResolvedValue(null),
      loadMany: vi.fn().mockResolvedValue([null]),
    }

    const generationPlanner = {
      plan: vi.fn().mockResolvedValue(planFixture),
    }

    const useCase = new CreateProjectUseCase(
      { validate: vi.fn((input) => input) } as never,
      { getKit: vi.fn(() => kitFixture) } as unknown as Catalog,
      { resolve: vi.fn(() => [featureFixture]) } as never,
      { check: vi.fn() } as never,
      {
        fetch: vi.fn().mockResolvedValue(kitTemplate),
        fetchMany: vi.fn().mockResolvedValue([featureTemplate]),
      } as never,
      manifestLoader as never,
      generationPlanner as never,
      { compose: vi.fn() } as never,
      { resolve: vi.fn() } as never,
      { init: vi.fn() } as never,
      { pathExists: vi.fn().mockResolvedValue(false) } as never
    )

    await useCase.execute({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kitSlug: 'base-kit',
      featureSlugs: ['auth'],
      installDependencies: false,
      initializeGit: false,
      dryRun: true,
    })

    expect(generationPlanner.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        kitManifest: null,
        featureManifests: [null],
      })
    )
  })
})
