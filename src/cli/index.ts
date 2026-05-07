import { Command } from 'commander'
import { createApp } from './bootstrap'
import { registerCreateCommand } from './commands/create.command'
import { registerListKitsCommand } from './commands/list-kits.command'
import { registerListFeaturesCommand } from './commands/list-features.command'
import { printer } from './output/printer'
import { formatError } from './output/format-error'
import { KnittoError } from '../core/errors/knitto-error'
import { makeCreateFlow } from './create-flow'

export async function main(): Promise<void> {
  const app = await createApp()

  const runCreateFlow = makeCreateFlow({
    catalog: app.catalog,
    createProjectUseCase: app.createProjectUseCase,
  })

  const program = new Command()

  program
    .name('knitto')
    .description('A modular project scaffolding CLI')
    .version('0.1.0')
    .action(async () => {
      await runCreateFlow()
    })

  registerCreateCommand(program, runCreateFlow)

  const list = program.command('list').description('List catalog items')
  registerListKitsCommand(list, app.catalog)
  registerListFeaturesCommand(list, app.catalog)

  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    printer.error(formatError(error))

    if (error instanceof KnittoError) {
      process.exitCode = 1
      return
    }

    process.exitCode = 1
  }
}
