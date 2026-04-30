import { execa } from 'execa'

import type { Shell } from './shell'

export class ExecaShell implements Shell {
  async run(
    command: string,
    args: string[],
    options: { cwd: string }
  ): Promise<void> {
    await execa(command, args, {
      cwd: options.cwd,
      stdio: 'inherit',
    })
  }
}
