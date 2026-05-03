import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Catalog } from '@core/catalog/catalog'
import type { GenerationPlan } from '@core/generation/generation-plan'
import ora from 'ora'
import { createProjectPrompt } from './prompts/create-project.prompt'
import { printPlan } from './output/print-plan'
import { printer } from './output/printer'
import { makeCreateFlow } from './create-flow'

vi.mock('ora', () => ({
  default: vi.fn(),
}))

vi.mock('./prompts/create-project.prompt', () => ({
  createProjectPrompt: vi.fn(),
}))

vi.mock('./output/print-plan', () => ({
  printPlan: vi.fn(),
}))

vi.mock('./output/printer', () => ({
  printer: {
    section: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

const planFixture: GenerationPlan = {
  project: {
    name: 'demo-app',
    targetDir: '/projects/demo-app',
    packageManager: 'pnpm',
  },
  sources: [],
  variables: {},
  operations: [],
  warnings: [],
  conflicts: [],
}

const answersFixture = {
  projectName: 'demo-app',
  kitSlug: 'base-kit',
  featureSlugs: ['auth'],
  packageManager: 'pnpm' as const,
  targetDir: '/projects/demo-app',
  dryRun: false,
  installDependencies: true,
  initializeGit: true,
}

describe('makeCreateFlow', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prints the executed project output when creation succeeds', async () => {
    const spinner = makeSpinner()
    const catalog = {} as Catalog
    const createProjectUseCase = {
      execute: vi.fn().mockResolvedValue({
        executed: true,
        projectName: 'demo-app',
        targetDir: '/projects/demo-app',
        plan: planFixture,
      }),
    }

    vi.mocked(ora).mockReturnValue({
      start: vi.fn(() => spinner),
    } as never)
    vi.mocked(createProjectPrompt).mockResolvedValue(answersFixture)

    const runCreateFlow = makeCreateFlow({
      catalog,
      createProjectUseCase: createProjectUseCase as never,
    })

    await runCreateFlow({ dryRun: false })

    expect(createProjectPrompt).toHaveBeenCalledWith(catalog, { dryRun: false })
    expect(createProjectUseCase.execute).toHaveBeenCalledWith(answersFixture)
    expect(ora).toHaveBeenCalledWith('Creating generation plan')
    expect(spinner.succeed).toHaveBeenCalledWith('Project created')
    expect(printPlan).toHaveBeenCalledWith(planFixture)
    expect(printer.section).toHaveBeenCalledWith('Next')
    expect(printer.success).toHaveBeenCalledWith(
      'Created demo-app in /projects/demo-app'
    )
    expect(printer.info).not.toHaveBeenCalled()
  })

  it('prints the dry-run output when no files are written', async () => {
    const spinner = makeSpinner()
    const createProjectUseCase = {
      execute: vi.fn().mockResolvedValue({
        executed: false,
        projectName: 'demo-app',
        targetDir: '/projects/demo-app',
        plan: planFixture,
      }),
    }

    vi.mocked(ora).mockReturnValue({
      start: vi.fn(() => spinner),
    } as never)
    vi.mocked(createProjectPrompt).mockResolvedValue(answersFixture)

    const runCreateFlow = makeCreateFlow({
      catalog: {} as Catalog,
      createProjectUseCase: createProjectUseCase as never,
    })

    await runCreateFlow()

    expect(spinner.succeed).toHaveBeenCalledWith('Dry run completed')
    expect(printPlan).toHaveBeenCalledWith(planFixture)
    expect(printer.info).toHaveBeenCalledWith(
      'Dry run only: no files were written.'
    )
    expect(printer.section).not.toHaveBeenCalled()
    expect(printer.success).not.toHaveBeenCalled()
  })

  it('fails the spinner and rethrows when project creation fails', async () => {
    const spinner = makeSpinner()
    const error = new Error('boom')
    const createProjectUseCase = {
      execute: vi.fn().mockRejectedValue(error),
    }

    vi.mocked(ora).mockReturnValue({
      start: vi.fn(() => spinner),
    } as never)
    vi.mocked(createProjectPrompt).mockResolvedValue(answersFixture)

    const runCreateFlow = makeCreateFlow({
      catalog: {} as Catalog,
      createProjectUseCase: createProjectUseCase as never,
    })

    await expect(runCreateFlow()).rejects.toThrow(error)

    expect(spinner.fail).toHaveBeenCalledWith('Failed to create project')
    expect(spinner.succeed).not.toHaveBeenCalled()
    expect(printPlan).not.toHaveBeenCalled()
  })
})

function makeSpinner() {
  return {
    succeed: vi.fn(),
    fail: vi.fn(),
  }
}
