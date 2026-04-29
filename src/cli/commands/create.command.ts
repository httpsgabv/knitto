import type { Command } from 'commander'
import type { App } from '../bootstrap'
import { createProjectPrompt } from '../prompts/create-project.prompt'
import ora from 'ora'

export function registerCreateCommand(program: Command, app: App) {
  program
    .command('create')
    .description('Create a new project from a kit')
    .action(async () => {
      const answers = await createProjectPrompt({
        catalog: app.catalog,
      })
      const spinner = ora('Creating generation plan').start()

      try {
        await app.createProjectUseCase.execute(answers)
        spinner.succeed('Project created')
      } catch (error) {
        spinner.fail('Failed to create project')
        throw error
      }
    })
}
