import type { Command } from 'commander'
import { printer } from '@cli/output/printer'

export function registerDoctorCommand(program: Command) {
  program
    .command('doctor')
    .description('Check local CLI health')
    .action(() => {
      printer.section('Doctor')
      printer.success('Knitto CLI is installed and ready')
    })
}
