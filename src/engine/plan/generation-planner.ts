import type {
  GenerationPlan,
  PlannedSources,
} from '../../core/generation/generation-plan'
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

    const kitOperations = this.operationBuilder.buildKitOperation({
      kit: input.kit,
      files: kitFiles,
      targetDir: input.targetDir,
    })

    const operations = this.operationSorter.sort([...kitOperations])
    const conflicts = this.conflictDetector.detect(operations)

    const sources: PlannedSources[] = [
      {
        type: 'kit',
        slug: input.kit.slug,
        templateRoot: input.kitTemplate.rootPath,
      },
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
