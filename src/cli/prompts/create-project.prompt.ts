import { input, select, confirm, checkbox } from '@inquirer/prompts'
import type { Catalog } from '../../core/catalog/catalog'
import type { SupportedPackageManager } from '../../core/project/project-config'

type CreateProjectPromptOptions = {
  catalog: Catalog
}

export type CreateProjectPromptAnswers = {
  projectName: string
  kitSlug: string
  featureSlugs: string[]
  packageManager: SupportedPackageManager
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

  const selectedKit = catalog.getKit(kitSlug)
  const availableFeatures = catalog
    .listFeatures()
    .filter(
      (feature) =>
        selectedKit.compatibleFeatures.includes(feature.slug) &&
        feature.supports.includes(selectedKit.slug)
    )

  const featureSlugs =
    availableFeatures.length > 0
      ? await checkbox({
          message: 'Optional features',
          choices: availableFeatures.map((feature) => ({
            message: feature.name,
            value: feature.slug,
            description: feature.description,
          })),
        })
      : []

  const packageManager = await select<SupportedPackageManager>({
    message: 'Package manager',
    choices: [
      {
        name: 'pnpm',
        value: 'pnpm',
      },
      {
        name: 'npm',
        value: 'npm',
      },
      {
        name: 'yarn',
        value: 'yarn',
      },
      {
        name: 'bun',
        value: 'bun',
      },
    ],
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
    featureSlugs,
    packageManager,
    dryRun: false,
    targetDir: `./${projectName}`,
    installDependencies,
    initializeGit,
  }
}
