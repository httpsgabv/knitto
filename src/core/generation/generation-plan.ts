import type { SupportedPackageManager } from '../project/project-config'
import type { FileOperation } from './file-operation'
import type { PlanConflict } from './plan-conflict'
import type { PlanWarning } from './plan-warning'

export type PlannedSources = {
  type: 'kit'
  slug: string
  templateRoot: string
}

export type GenerationPlan = {
  project: {
    name: string
    targetDir: string
    packageManager: SupportedPackageManager
  }
  sources: PlannedSources[]
  variables: Record<string, string>
  operations: FileOperation[]
  warnings: PlanWarning[]
  conflicts: PlanConflict[]
}
