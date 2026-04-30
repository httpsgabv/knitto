import type { SupportedPackageManager } from '@core/project/project-config'

export type CreateProjectInput = {
  projectName: string
  kitSlug: string
  featureSlugs?: string[]
  packageManager?: SupportedPackageManager
  targetDir?: string | undefined
  dryRun?: boolean | undefined
  installDependencies?: boolean | undefined
  initializeGit?: boolean | undefined
}
