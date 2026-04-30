import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { SupportedPackageManager } from '@core/project/project-config'
import type { Shell } from '@adapters/shell/shell'
import { BunPackageManager } from './bun-package-manager'
import { NpmPackageManager } from './npm-package-manager'
import type { PackageManager } from './package-manager'
import { PnpmPackageManager } from './pnpm-package-manager'
import { YarnPackageManager } from './yarn-package-manager'

export class PackageManagerResolver {
  constructor(private readonly shell: Shell) {}

  resolve(name: SupportedPackageManager): PackageManager {
    switch (name) {
      case 'pnpm':
        return new PnpmPackageManager(this.shell)
      case 'yarn':
        return new YarnPackageManager(this.shell)
      case 'npm':
        return new NpmPackageManager(this.shell)
      case 'bun':
        return new BunPackageManager(this.shell)
      default:
        throw new KnittoError(
          `Unsupported package manager: ${String(name)}`,
          Errors.UNSUPPORTED_PACKAGE_MANAGER
        )
    }
  }
}
