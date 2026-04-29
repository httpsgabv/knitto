import type { Command } from 'commander'
import type { App } from '../bootstrap'
import { createProjectPrompt } from '../prompts/create-project.prompt'
import ora from 'ora'
import { printPlan } from '../output/print-plan'

export function registerCreateCommand(program: Command, app: App) {
  program
    .command('create')
    .description('Create a new project from a kit')
    .option('--dry-run', 'Plan changes without writting files')
    .option('--no-install', 'Skip dependency installation')
    .option('--no-git', 'Skip git initialization')
    .option('--target-dir <path>', 'Target directory')
    .action(async () => {
      const answers = await createProjectPrompt({
        catalog: app.catalog,
      })
      const spinner = ora('Creating generation plan').start()

      try {
        const result = await app.createProjectUseCase.execute(answers)
        spinner.succeed(
          result.executed ? 'Project created' : 'Dry run completed'
        )

        printPlan(result.plan)
      } catch (error) {
        spinner.fail('Failed to create project')
        throw error
      }
    })
}
