import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Catalog } from '@core/catalog/catalog'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import {
  checkbox,
  confirm,
  input,
  select,
} from '@inquirer/prompts'
import { createProjectPrompt } from './create-project.prompt'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  checkbox: vi.fn(),
}))

const baseKit: Kit = {
  name: 'Base Kit',
  slug: 'base-kit',
  description: 'Base kit',
  source: {
    type: 'github',
    repo: 'knitto/base-kit',
    name: 'base-kit',
    path: '.',
  },
  compatibleFeatures: ['auth'],
}

const authFeature: Feature = {
  name: 'Authentication',
  slug: 'auth',
  description: 'Adds auth support',
  source: {
    type: 'github',
    repo: 'knitto/auth',
    name: 'auth',
    path: '.',
  },
  supports: ['base-kit'],
  requires: [],
  conflictsWith: [],
}

const incompatibleFeature: Feature = {
  name: 'Payments',
  slug: 'payments',
  description: 'Adds payments',
  source: {
    type: 'github',
    repo: 'knitto/payments',
    name: 'payments',
    path: '.',
  },
  supports: ['other-kit'],
  requires: [],
  conflictsWith: [],
}

describe('createProjectPrompt', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prompts for every interactive answer and derives defaults when none are provided', async () => {
    const catalog = makeCatalog()

    vi.mocked(input).mockResolvedValue('demo-app')
    vi.mocked(select)
      .mockResolvedValueOnce('base-kit')
      .mockResolvedValueOnce('pnpm')
    vi.mocked(checkbox).mockResolvedValue(['auth'])
    vi.mocked(confirm).mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    const answers = await createProjectPrompt(catalog, {})

    expect(answers).toEqual({
      projectName: 'demo-app',
      kitSlug: 'base-kit',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: './demo-app',
      dryRun: false,
      installDependencies: true,
      initializeGit: false,
    })
    expect(input).toHaveBeenCalledTimes(1)
    expect(select).toHaveBeenCalledTimes(2)
    expect(checkbox).toHaveBeenCalledWith({
      message: 'Optional features',
      choices: [
        {
          message: 'Authentication',
          value: 'auth',
          description: 'Adds auth support',
        },
      ],
    })
    expect(confirm).toHaveBeenCalledTimes(2)
  })

  it('returns the fully defaulted answers without prompting', async () => {
    const catalog = makeCatalog()

    const answers = await createProjectPrompt(catalog, {
      projectName: 'demo-app',
      kitSlug: 'base-kit',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: '/tmp/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(answers).toEqual({
      projectName: 'demo-app',
      kitSlug: 'base-kit',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: '/tmp/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })
    expect(input).not.toHaveBeenCalled()
    expect(select).not.toHaveBeenCalled()
    expect(checkbox).not.toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('skips feature selection when the selected kit has no compatible features', async () => {
    const kitWithoutFeatures: Kit = {
      ...baseKit,
      compatibleFeatures: [],
    }
    const catalog = makeCatalog({ kit: kitWithoutFeatures })

    const answers = await createProjectPrompt(catalog, {
      projectName: 'demo-app',
      kitSlug: 'base-kit',
      packageManager: 'yarn',
      installDependencies: true,
      initializeGit: true,
    })

    expect(answers.featureSlugs).toEqual([])
    expect(answers.targetDir).toBe('./demo-app')
    expect(answers.dryRun).toBe(false)
    expect(checkbox).not.toHaveBeenCalled()
  })

  it('prompts for feature selection when compatible features are available and no default is provided', async () => {
    const catalog = makeCatalog()

    vi.mocked(checkbox).mockResolvedValue(['auth'])

    const answers = await createProjectPrompt(catalog, {
      projectName: 'demo-app',
      kitSlug: 'base-kit',
      packageManager: 'bun',
      installDependencies: false,
      initializeGit: false,
    })

    expect(answers.featureSlugs).toEqual(['auth'])
    expect(checkbox).toHaveBeenCalledTimes(1)
  })
})

function makeCatalog(overrides: { kit?: Kit; features?: Feature[] } = {}): Catalog {
  const kit = overrides.kit ?? baseKit
  const features = overrides.features ?? [authFeature, incompatibleFeature]

  return {
    listKits: () => [kit],
    listFeatures: () => features,
    getKit: () => kit,
    getFeature: (slug) => {
      const feature = features.find((candidate) => candidate.slug === slug)

      if (feature === undefined) {
        throw new Error(`Unknown feature: ${slug}`)
      }

      return feature
    },
  }
}
