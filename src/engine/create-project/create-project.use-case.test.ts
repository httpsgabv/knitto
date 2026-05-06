import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { Catalog } from '@core/catalog/catalog'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import { Errors } from '@core/errors/errors'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import type { GenerationPlan } from '@core/generation/generation-plan'
import type { Template } from '@core/template/template'
import { normalizeSystemPath } from '@shared/paths'
import { FakePackageManager } from '@test/adapters/package-manager/fake-package-manager'
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

  it('returns a dry-run result without composing, installing, or initializing git', async () => {
    const { useCase, templateComposer, packageManagerResolver, gitClient } = makeSut()

    const result = await useCase.execute(createInput())

    expect(result).toEqual({
      projectName: 'demo-app',
      targetDir: normalizeSystemPath(path.resolve('/projects/demo-app')),
      plan: planFixture,
      executed: false,
    })
    expect(templateComposer.compose).not.toHaveBeenCalled()
    expect(packageManagerResolver.resolve).not.toHaveBeenCalled()
    expect(gitClient.init).not.toHaveBeenCalled()
  })

  it('composes the project without post-generation steps when execution toggles are disabled', async () => {
    const { useCase, templateComposer, packageManagerResolver, gitClient } = makeSut()

    const result = await useCase.execute({
      ...createInput(),
      dryRun: false,
    })

    expect(result).toEqual({
      projectName: 'demo-app',
      targetDir: normalizeSystemPath(path.resolve('/projects/demo-app')),
      plan: planFixture,
      executed: true,
    })
    expect(templateComposer.compose).toHaveBeenCalledWith(planFixture)
    expect(packageManagerResolver.resolve).not.toHaveBeenCalled()
    expect(gitClient.init).not.toHaveBeenCalled()
  })

  it('installs dependencies and initializes git when enabled', async () => {
    const { useCase, packageManagerResolver, packageManager, gitClient } = makeSut()

    await useCase.execute({
      ...createInput(),
      dryRun: false,
      installDependencies: true,
      initializeGit: true,
    })

    expect(packageManagerResolver.resolve).toHaveBeenCalledWith('pnpm')
    expect(packageManager.getInstallCalls()).toEqual([
      { cwd: normalizeSystemPath(path.resolve('/projects/demo-app')) },
    ])
    expect(gitClient.init).toHaveBeenCalledWith(
      normalizeSystemPath(path.resolve('/projects/demo-app'))
    )
  })

  it('defaults the target directory to the project name when one is not provided', async () => {
    const { useCase, generationPlanner, templateComposer } = makeSut()
    const expectedTargetDir = normalizeSystemPath(path.resolve('demo-app'))

    const result = await useCase.execute({
      ...createInput(),
      targetDir: undefined,
      dryRun: false,
    })

    expect(result.targetDir).toBe(expectedTargetDir)
    expect(generationPlanner.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDir: expectedTargetDir,
      })
    )
    expect(templateComposer.compose).toHaveBeenCalledWith(planFixture)
  })

  it('preserves UNC-style absolute target directories when normalizing explicit input', async () => {
    const { useCase, generationPlanner } = makeSut()
    const targetDir = '\\\\server\\share\\demo-app'
    const expectedTargetDir = '//server/share/demo-app'

    const result = await useCase.execute({
      ...createInput(),
      targetDir,
    })

    expect(result.targetDir).toBe(expectedTargetDir)
    expect(generationPlanner.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDir: expectedTargetDir,
      })
    )
  })

  it('preserves windows drive roots for explicit target directories', async () => {
    const { useCase, generationPlanner } = makeSut()

    const result = await useCase.execute({
      ...createInput(),
      targetDir: 'C:\\projects\\demo-app',
    })

    expect(result.targetDir).toBe('C:/projects/demo-app')
    expect(generationPlanner.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDir: 'C:/projects/demo-app',
      })
    )
  })

  it('throws when the target directory already exists', async () => {
    const { useCase, catalog } = makeSut({
      fileSystem: {
        pathExists: vi.fn().mockResolvedValue(true),
      },
    })

    await expect(useCase.execute(createInput())).rejects.toThrow(
      `Target directory already exists: ${normalizeSystemPath(
        path.resolve('/projects/demo-app')
      )}`
    )
    await expect(useCase.execute(createInput())).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.TARGET_DIR_EXISTS,
    })
    expect(catalog.getKit).not.toHaveBeenCalled()
  })

  it('throws when the generation plan contains conflicts', async () => {
    const planWithConflicts: GenerationPlan = {
      ...planFixture,
      conflicts: [
        {
          code: 'DUPLICATE_TARGET',
          message: 'package.json would be written twice',
          target: 'package.json',
          operationIds: ['kit-package-json', 'feature-package-json'],
        },
      ],
    }
    const { useCase, templateComposer } = makeSut({
      generationPlanner: {
        plan: vi.fn().mockResolvedValue(planWithConflicts),
      },
    })

    await expect(
      useCase.execute({
        ...createInput(),
        dryRun: false,
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.PLAN_HAS_CONFLICTS,
      message: 'Generation plan contains conflicts',
      details: planWithConflicts.conflicts,
    })
    expect(templateComposer.compose).not.toHaveBeenCalled()
  })

  it('throws when fetched feature templates do not align with selected features', async () => {
    const { useCase, generationPlanner } = makeSut({
      templateProvider: {
        fetch: vi.fn().mockResolvedValue(kitTemplate),
        fetchMany: vi.fn().mockResolvedValue([]),
      },
    })

    await expect(useCase.execute(createInput())).rejects.toThrow(
      'Feature templates must align with selected features'
    )
    expect(generationPlanner.plan).not.toHaveBeenCalled()
  })
})

function createInput() {
  return {
    projectName: 'demo-app',
    targetDir: '/projects/demo-app',
    packageManager: 'pnpm' as const,
    kitSlug: 'base-kit',
    featureSlugs: ['auth'],
    installDependencies: false,
    initializeGit: false,
    dryRun: true,
  }
}

function makeSut(overrides?: {
  fileSystem?: { pathExists: ReturnType<typeof vi.fn> }
  generationPlanner?: { plan: ReturnType<typeof vi.fn> }
  templateProvider?: {
    fetch: ReturnType<typeof vi.fn>
    fetchMany: ReturnType<typeof vi.fn>
  }
}) {
  const inputValidator = { validate: vi.fn((input) => input) }
  const catalog = { getKit: vi.fn(() => kitFixture) }
  const featureResolver = { resolve: vi.fn(() => [featureFixture]) }
  const compatibilityChecker = { check: vi.fn() }
  const templateProvider =
    overrides?.templateProvider ?? {
      fetch: vi.fn().mockResolvedValue(kitTemplate),
      fetchMany: vi.fn().mockResolvedValue([featureTemplate]),
    }
  const manifestLoader = {
    load: vi.fn().mockResolvedValue(null),
    loadMany: vi.fn().mockResolvedValue([null]),
  }
  const generationPlanner =
    overrides?.generationPlanner ?? {
      plan: vi.fn().mockResolvedValue(planFixture),
    }
  const templateComposer = { compose: vi.fn().mockResolvedValue(undefined) }
  const packageManager = new FakePackageManager()
  const packageManagerResolver = { resolve: vi.fn(() => packageManager) }
  const gitClient = { init: vi.fn().mockResolvedValue(undefined) }
  const fileSystem =
    overrides?.fileSystem ?? { pathExists: vi.fn().mockResolvedValue(false) }

  const useCase = new CreateProjectUseCase(
    inputValidator as never,
    catalog as unknown as Catalog,
    featureResolver as never,
    compatibilityChecker as never,
    templateProvider as never,
    manifestLoader as never,
    generationPlanner as never,
    templateComposer as never,
    packageManagerResolver as never,
    gitClient as never,
    fileSystem as never
  )

  return {
    useCase,
    catalog,
    generationPlanner,
    templateComposer,
    packageManagerResolver,
    packageManager,
    gitClient,
  }
}
