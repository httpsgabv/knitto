import { input, select, confirm } from '@inquirer/prompts'
import type { PackageManager } from '../../config/package-manager.registry.js'
import type { Catalog } from '../../core/catalog/catalog.js'

type CreateProjectPromptOptions = {
  catalog: Catalog
}

export type CreateProjectPromptAnswers = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: PackageManager
  targetDir: string
  dryRun: boolean
  installDependencies: boolean
  initializeGit: boolean
}

export async function createProjectPrompt({
  catalog,
}: CreateProjectPromptOptions): Promise<CreateProjectPromptAnswers> {
  const projectName = await input({
    message: 'What is the name of your project?',
    default: 'my-app',
    required: true,
  })

  const kitSlug = await select({
    message: 'Which kit do you want to use?',
    choices: catalog.listKits().map((kit) => ({
      name: kit.name,
      value: kit.slug,
    })),
  })

  const installDependencies = await confirm({
    message: 'Install dependencies?',
    default: true,
  })

  const initializeGit = await confirm({
    message: 'Initialize git?',
    default: true,
  })

  return {
    projectName,
    kitSlug,
    featureSlug: [],
    packageManager: 'pnpm',
    dryRun: false,
    targetDir: `./${projectName}`,
    installDependencies,
    initializeGit,
  }
}
