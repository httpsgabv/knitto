import type { Shell } from '../shell/shell'
import type { PackageManager } from './package-manager'

export class PnpmPackageManager implements PackageManager {
  constructor(private readonly shell: Shell) {}

  async install(cwd: string): Promise<void> {
    await this.shell.run('pnpm', ['install'], { cwd })
  }
}
