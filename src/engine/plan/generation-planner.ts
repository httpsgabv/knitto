import type {
  GenerationPlan,
  PlannedSources,
} from '@core/generation/generation-plan'
import type { ConflictDetector } from './conflict-detector'
import { ManifestFileFilter } from '../manifest/manifest-file-filter'
import { ManifestOperationsExpander } from './manifest-operations-expander'
import { ManifestPlanningInputValidator } from './manifest-planning-input-validator'
import type { OperationSorter } from './operation-sorter'
import type { PlanInput } from './plan-input'
import type { TemplateScanner } from './template-scanner'

export class GenerationPlanner {
  constructor(
    private readonly templateScanner: TemplateScanner,
    private readonly operationSorter: OperationSorter,
    private readonly conflictDetector: ConflictDetector,
    private readonly manifestFileFilter: ManifestFileFilter,
    private readonly manifestPlanningInputValidator: ManifestPlanningInputValidator,
    private readonly manifestOperationsExpander: ManifestOperationsExpander
  ) {}

  async plan(input: PlanInput): Promise<GenerationPlan> {
    const { kitManifest, featureManifests } =
      this.manifestPlanningInputValidator.validate(input)

    const variables = this.buildVariables(input.projectName)
    const kitFiles = await this.templateScanner.scan(input.kitTemplate)
    const featureFiles = await Promise.all(
      input.featureTemplates.map((template) =>
        this.templateScanner.scan(template)
      )
    )

    const filteredKitFiles = this.manifestFileFilter.filter(
      kitFiles,
      kitManifest
    )
    const filteredFeatureFiles = featureFiles.map((files, index) => {
      const manifest = featureManifests[index]

      if (manifest === undefined) {
        throw new Error('Feature manifests must align with selected features')
      }

      return this.manifestFileFilter.filter(files, manifest)
    })

    const manifestOperations = this.manifestOperationsExpander.expand({
      planInput: input,
      kitFiles: filteredKitFiles,
      featureFiles: filteredFeatureFiles,
      kitManifest,
      featureManifests,
    })

    const operations = this.operationSorter.sort(manifestOperations)
    const conflicts = this.conflictDetector.detect(operations)

    const sources: PlannedSources[] = [
      {
        type: 'kit',
        slug: input.kit.slug,
        templateRoot: input.kitTemplate.rootPath,
      },
      ...input.features.map((feature, index) => ({
        type: 'feature' as const,
        slug: feature.slug,
        templateRoot: input.featureTemplates[index]?.rootPath ?? '',
      })),
    ]

    return {
      project: {
        name: input.projectName,
        targetDir: input.targetDir,
        packageManager: input.packageManager,
      },
      sources,
      variables,
      operations,
      warnings: [],
      conflicts,
    }
  }

  private buildVariables(projectName: string): Record<string, string> {
    return {
      PROJECT_NAME: projectName,
    }
  }
}
