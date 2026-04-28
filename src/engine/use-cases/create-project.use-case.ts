import type { PackageManager } from '../../config/package-manager.registry.js'
import type { ProjectNameValidator } from '../services/project-name-validator.js'

type CreateProjectUseCaseInput = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: PackageManager
}

type CreateProjectUseCaseDeps = {
  projectNameValidator: ProjectNameValidator
}

export class CreateProjectUseCase {
  constructor(private deps: CreateProjectUseCaseDeps) {}

  async execute(input: CreateProjectUseCaseInput) {
    const projectName = await this.deps.projectNameValidator.validate({
      projectName: input.projectName,
    })

    console.log('Creating project with the following details:', projectName)

    return Promise.resolve()
  }
}
