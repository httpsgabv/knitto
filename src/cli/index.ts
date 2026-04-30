import { Command } from 'commander'
import { createApp } from './bootstrap.js'
import { registerCreateCommand } from './commands/create.command.js'
import { registerListKitsCommand } from './commands/list-kits.command.js'
import { registerDoctorCommand } from './commands/doctor.command.js'
import { registerListFeaturesCommand } from './commands/list-features.command.js'
import { printer } from './output/printer.js'
import { formatError } from './output/format-error.js'
import { KnittoError } from '../core/errors/knitto-error.js'
import { makeCreateFlow } from './create-flow.js'

export async function main(): Promise<void> {
  const app = createApp()

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
  registerDoctorCommand(program)

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
