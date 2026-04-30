import { input, select, confirm, checkbox } from '@inquirer/prompts'
import type { SupportedPackageManager } from '../../core/project/project-config'
import type { CreateProjectInput } from '../../engine/create-project/create-project.input'
import type { Catalog } from '../../core/catalog/catalog'

type CreateProjectPromptOptions = Partial<CreateProjectInput>

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

export async function createProjectPrompt(
  catalog: Catalog,
  defaults: CreateProjectPromptOptions
): Promise<CreateProjectPromptAnswers> {
  const projectName =
    defaults.projectName ??
    (await input({
      message: 'What is the name of your project?',
      default: 'my-app',
      required: true,
    }))

  const kitSlug =
    defaults.kitSlug ??
    (await select({
      message: 'Which kit do you want to use?',
      choices: catalog.listKits().map((kit) => ({
        name: kit.name,
        value: kit.slug,
      })),
    }))

  const selectedKit = catalog.getKit(kitSlug)
  const availableFeatures = catalog
    .listFeatures()
    .filter(
      (feature) =>
        selectedKit.compatibleFeatures.includes(feature.slug) &&
        feature.supports.includes(selectedKit.slug)
    )

  const featureSlugs =
    (defaults.featureSlugs ?? availableFeatures.length > 0)
      ? await checkbox({
          message: 'Optional features',
          choices: availableFeatures.map((feature) => ({
            message: feature.name,
            value: feature.slug,
            description: feature.description,
          })),
        })
      : []

  const packageManager =
    defaults.packageManager ??
    (await select<SupportedPackageManager>({
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
    }))

  const installDependencies =
    defaults.installDependencies ??
    (await confirm({
      message: 'Install dependencies?',
      default: true,
    }))

  const initializeGit =
    defaults.initializeGit ??
    (await confirm({
      message: 'Initialize git?',
      default: true,
    }))

  return {
    projectName,
    kitSlug,
    featureSlugs,
    packageManager,
    dryRun: defaults.dryRun ?? false,
    targetDir: defaults.targetDir ?? `./${projectName}`,
    installDependencies,
    initializeGit,
  }
}
