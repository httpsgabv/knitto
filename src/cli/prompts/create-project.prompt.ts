import type { Command } from 'commander'

export type CreateProjectPromptAnswers = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: 'npm' | 'yarn' | 'pnpm'
}

export async function createProjectPrompt(
  program: Command
): Promise<CreateProjectPromptAnswers> {}
