import ora from 'ora'
import type { Catalog } from '../core/catalog/catalog'
import type { CreateProjectInput } from '../engine/create-project/create-project.input'
import type { CreateProjectUseCase } from '../engine/create-project/create-project.use-case'
import { createProjectPrompt } from './prompts/create-project.prompt'
import { printPlan } from './output/print-plan'
import { printer } from './output/printer'

export type RunCreateFlow = (
  defaults?: Partial<CreateProjectInput>
) => Promise<void>

export function makeCreateFlow(deps: {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}): RunCreateFlow {
  return async (defaults = {}) => {
    const answers = await createProjectPrompt(deps.catalog, defaults)
    const spinner = ora('Creating generation plan').start()

    try {
      const result = await deps.createProjectUseCase.execute(answers)
      spinner.succeed(result.executed ? 'Project created' : 'Dry run completed')

      printPlan(result.plan)

      if (result.executed) {
        printer.section('Next')
        printer.success(`Created ${result.projectName} in ${result.targetDir}`)
      } else {
        printer.info('Dry run only: no files were written.')
      }
    } catch (error) {
      spinner.fail('Failed to create project')
      throw error
    }
  }
}
