import { OfficialCatalog } from '../catalog/official-catalog.js'
import type { Catalog } from '../core/catalog/catalog.js'
import { ProjectNameValidator } from '../engine/services/project-name-validator.js'
import { CreateProjectUseCase } from '../engine/use-cases/create-project.use-case.js'

export type App = {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const catalog = new OfficialCatalog()

  const projectNameValidator = new ProjectNameValidator()

  const createProjectUseCase = new CreateProjectUseCase({
    projectNameValidator,
  })

  return {
    catalog,
    createProjectUseCase,
  }
}
