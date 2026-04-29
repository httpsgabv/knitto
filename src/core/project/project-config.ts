export type SupportedPackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export type ProjectConfig = {
  name: string
  targetDir: string
  packageManager: SupportedPackageManager
}
