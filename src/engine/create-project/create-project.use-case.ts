import type { CreateProjectInput } from './create-project.input'
import type { CreateProjectInputValidator } from './create-project-input.validator'
import type { CreateProjectOutput } from './create-project.output'
import path from 'node:path'
import type { FileSystem } from '../../adapters/fs/file-system'
import { KnittoError } from '../../core/errors/knitto-error'
import { Errors } from '../../core/errors/errors'

export class CreateProjectUseCase {
  constructor(
    private readonly inputValidator: CreateProjectInputValidator,
    private readonly fileSystem: FileSystem
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

    return {
      projectName: data.projectName,
      targetDir,
      executed: true,
    }
  }
}
