import type { Shell } from '@adapters/shell/shell'
import type { PackageManager } from './package-manager'

export class YarnPackageManager implements PackageManager {
  constructor(private readonly shell: Shell) {}

  async install(cwd: string): Promise<void> {
    await this.shell.run('yarn', ['install'], { cwd })
  }
}
