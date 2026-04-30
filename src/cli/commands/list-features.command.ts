import type { Command } from 'commander'
import { printer } from '@cli/output/printer'
import type { Catalog } from '@core/catalog/catalog'

export function registerListFeaturesCommand(
  program: Command,
  catalog: Catalog
) {
  program
    .command('features')
    .description('List available features')
    .action(() => {
      printer.section('Available Features')
      for (const feature of catalog.listFeatures()) {
        printer.muted(
          `- ${feature.slug}: ${feature.name} - ${feature.description}`
        )
      }
    })
}
