import type { SupportedPackageManager } from '../project/project-config'
import type { PlanConflict } from './plan-conflict'
import type { GenerationOperation } from './operation'
import type { PlanWarning } from './plan-warning'

export type PlannedSources = {
  type: 'kit' | 'feature'
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
  operations: GenerationOperation[]
  warnings: PlanWarning[]
  conflicts: PlanConflict[]
}
