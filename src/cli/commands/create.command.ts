import type { Command } from 'commander'
import type { App } from '../bootstrap.js'

export function registerCreateCommand(program: Command, app: App) {
  program
    .command('create')
    .description('Create a new project from a kit')
    .action(async () => {
      console.log('create command executed')
    })
}
