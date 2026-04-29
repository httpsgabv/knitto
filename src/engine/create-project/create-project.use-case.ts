import type { CreateProjectInput } from './create-project.input'
import type { CreateProjectInputValidator } from './create-project-input.validator'
import type { CreateProjectOutput } from './create-project.output'
import path from 'node:path'
import type { FileSystem } from '../../adapters/fs/file-system'
import { KnittoError } from '../../core/errors/knitto-error'
import { Errors } from '../../core/errors/errors'
import type { TemplateSourceProvider } from '../../adapters/template-source/template-source-provider'
import type { Catalog } from '../../core/catalog/catalog'
import type { GenerationPlanner } from '../plan/generation-planner'

export class CreateProjectUseCase {
  constructor(
    private readonly inputValidator: CreateProjectInputValidator,
    private readonly fileSystem: FileSystem,
    private readonly catalog: Catalog,
    private readonly templateProvider: TemplateSourceProvider,
    private readonly generationPlanner: GenerationPlanner
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const data = this.inputValidator.validate(input)
    const targetDir = path.resolve(data.targetDir ?? data.projectName)

    if (await this.fileSystem.pathExists(targetDir)) {
      throw new KnittoError(
        `Target directory already exists: ${targetDir}`,
        Errors.TARGET_DIR_EXISTS
      )
    }

    const kit = this.catalog.getKit(data.kitSlug)

    const kitTemplate = await this.templateProvider.fetch(kit.source)

    const plan = await this.generationPlanner.plan({
      projectName: data.projectName,
      targetDir,
      packageManager: data.packageManager,
      kit,
      kitTemplate,
    })

    if (plan.conflicts.length > 0) {
      throw new KnittoError(
        'Generation plan contains conflicts',
        Errors.PLAN_HAS_CONFLICTS,
        plan.conflicts
      )
    }

    if (data.dryRun) {
      return {
        projectName: data.projectName,
        targetDir,
        plan,
        executed: false,
      }
    }

    return {
      projectName: data.projectName,
      targetDir,
      plan,
      executed: true,
    }
  }
}
