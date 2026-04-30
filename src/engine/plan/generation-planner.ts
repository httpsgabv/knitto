import type {
  GenerationPlan,
  PlannedSources,
} from '@core/generation/generation-plan'
import type { ConflictDetector } from './conflict-detector'
import type { OperationBuilder } from './operation-builder'
import type { OperationSorter } from './operation-sorter'
import type { PlanInput } from './plan-input'
import type { TemplateScanner } from './template-scanner'

export class GenerationPlanner {
  constructor(
    private readonly templateScanner: TemplateScanner,
    private readonly operationBuilder: OperationBuilder,
    private readonly operationSorter: OperationSorter,
    private readonly conflictDetector: ConflictDetector
  ) {}

  async plan(input: PlanInput): Promise<GenerationPlan> {
    const variables = this.buildVariables(input.projectName)
    const kitFiles = await this.templateScanner.scan(input.kitTemplate)
    const featureFiles = await Promise.all(
      input.featureTemplates.map((template) =>
        this.templateScanner.scan(template)
      )
    )

    const kitOperations = this.operationBuilder.buildKitOperation({
      kit: input.kit,
      files: kitFiles,
      targetDir: input.targetDir,
    })

    const featureOperations = input.features.flatMap((feature, index) =>
      this.operationBuilder.buildFeatureOperation({
        feature,
        files: featureFiles[index] ?? [],
        targetDir: input.targetDir,
      })
    )

    const operations = this.operationSorter.sort([
      ...kitOperations,
      ...featureOperations,
    ])
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
