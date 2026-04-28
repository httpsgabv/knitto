import type { Command } from 'commander'
import type { App } from '../bootstrap.js'
import { createProjectPrompt } from '../prompts/create-project.prompt.js'

export function registerCreateCommand(program: Command, app: App) {
  program
    .command('create')
    .description('Create a new project from a kit')
    .action(async () => {
      const answers = await createProjectPrompt()

      await app.createProjectUseCase.execute(answers)
    })
}
