import type { PackageManager } from '@adapters/package-manager/package-manager'

export interface FakePackageManagerCall {
  method: 'install'
  args: [cwd: string]
}

export class FakePackageManager implements PackageManager {
  private calls: FakePackageManagerCall[] = []

  async install(cwd: string): Promise<void> {
    this.calls.push({ method: 'install', args: [cwd] })
  }

  getCalls(): FakePackageManagerCall[] {
    return [...this.calls]
  }

  getInstallCalls(): Array<{ cwd: string }> {
    return this.calls
      .filter((call) => call.method === 'install')
      .map((call) => ({ cwd: call.args[0] }))
  }

  clearCalls(): void {
    this.calls = []
  }
}
