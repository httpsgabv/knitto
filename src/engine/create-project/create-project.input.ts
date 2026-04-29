import type { SupportedPackageManager } from '../../core/project/project-config'

export type CreateProjectInput = {
  projectName: string
  kitSlug: string
  featureSlugs?: string[]
  packageManager?: SupportedPackageManager
  targetDir?: string
  dryRun?: boolean
  installDependencies?: boolean
  initializeGit?: boolean
}
