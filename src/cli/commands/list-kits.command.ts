import type { Command } from 'commander'
import { printer } from '@cli/output/printer'
import type { Catalog } from '@core/catalog/catalog'

export function registerListKitsCommand(program: Command, catalog: Catalog) {
  program
    .command('kits')
    .description('List available kits')
    .action(() => {
      printer.section('Available Kits')
      for (const kit of catalog.listKits()) {
        printer.muted(`- ${kit.slug}: ${kit.name} - ${kit.description}`)
      }
    })
}
