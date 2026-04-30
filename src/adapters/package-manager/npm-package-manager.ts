import type { Shell } from "../shell/shell.js"
import type { PackageManager } from "./package-manager.js"

export class NpmPackageManager implements PackageManager {
  constructor(private readonly shell: Shell) {}

  async install(cwd: string): Promise<void> {
    await this.shell.run("npm", ["install"], { cwd })
  }
}
