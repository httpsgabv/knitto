import { NodeFileSystem } from '../adapters/fs/node-file-system'
import { OfficialCatalog } from '../catalog/official-catalog'
import type { Catalog } from '../core/catalog/catalog'
import { CreateProjectInputValidator } from '../engine/create-project/create-project-input.validator'
import { CreateProjectUseCase } from '../engine/create-project/create-project.use-case'

export type App = {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const catalog = new OfficialCatalog()

  const fileSystem = new NodeFileSystem()

  const createProjectUseCase = new CreateProjectUseCase(
    new CreateProjectInputValidator(),
    fileSystem
  )

  return {
    catalog,
    createProjectUseCase,
  }
}
