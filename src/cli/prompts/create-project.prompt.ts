import { input, select } from '@inquirer/prompts'
import { Kits } from '../../config/kits.registry.js'
import type { PackageManager } from '../../config/package-manager.registry.js'

export type CreateProjectPromptAnswers = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: PackageManager
}

export async function createProjectPrompt(): Promise<CreateProjectPromptAnswers> {
  const projectName = await input({
    message: 'What is the name of your project?',
    default: 'my-app',
    required: true,
    validate: (value) => {
      if (!value || value.trim() === '') return 'Project name is required'

      return true
    },
  })

  const kit = await select({
    message: 'Which kit do you want to use?',
    choices: Kits.map((kit) => ({
      name: kit.name,
      value: kit.slug,
    })),
  })

  return {
    projectName,
    kitSlug: kit,
    featureSlug: [],
    packageManager: 'pnpm',
  }
}
