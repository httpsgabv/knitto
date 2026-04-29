import { Command } from 'commander'
import { createApp } from './bootstrap.js'
import { registerCreateCommand } from './commands/create.command.js'
import { registerListKitsCommand } from './commands/list-kits.command.js'
import { registerDoctorCommand } from './commands/doctor.command.js'

export async function main(): Promise<void> {
  const app = createApp()

  const program = new Command()

  program
    .name('knitto')
    .description('A modular project scaffolding CLI')
    .version('0.1.0')

  registerCreateCommand(program, app)
  const list = program.command('list').description('List catalog items')
  registerListKitsCommand(list, app.catalog)
  registerDoctorCommand(program)

  await program.parseAsync(process.argv)
}
