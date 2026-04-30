import type { Shell } from '@adapters/shell/shell'
import type { PackageManager } from './package-manager'

export class BunPackageManager implements PackageManager {
  constructor(private readonly shell: Shell) {}

  async install(cwd: string): Promise<void> {
    await this.shell.run('bun', ['install'], { cwd })
  }
}
