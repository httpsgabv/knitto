import type { PackageManager } from '../../config/package-manager.registry.js'

type CreateProjectUseCaseInput = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: PackageManager
}

export class CreateProjectUseCase {
  constructor() {}

  async execute(input: CreateProjectUseCaseInput) {
    return Promise.resolve()
  }
}
