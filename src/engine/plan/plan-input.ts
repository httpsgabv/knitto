import type { Feature } from '../../core/catalog/feature'
import type { Kit } from '../../core/catalog/kit'
import type { SupportedPackageManager } from '../../core/project/project-config'
import type { Template } from '../../core/template/template'

export type PlanInput = {
  projectName: string
  targetDir: string
  packageManager: SupportedPackageManager
  kit: Kit
  features: Feature[]
  kitTemplate: Template
  featureTemplates: Template[]
}
