import type { Command } from 'commander'
import type { CreateProjectInput } from '../../engine/create-project/create-project.input'
import { RunCreateFlow } from '../create-flow'

export function registerCreateCommand(
  program: Command,
  runCreateFlow: RunCreateFlow
) {
  program
    .command('create')
    .description('Create a new project from a kit')
    .option('--dry-run', 'Plan changes without writting files', false)
    .option('--no-install', 'Skip dependency installation', false)
    .option('--no-git', 'Skip git initialization', false)
    .option('--target-dir <path>', 'Target directory')
    .action(async (options: CreateProjectInput) => {
      await runCreateFlow({
        dryRun: options.dryRun,
        installDependencies: options.installDependencies,
        initializeGit: options.initializeGit,
        targetDir: options.targetDir,
      })
    })
}
