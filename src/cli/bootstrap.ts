import { NodeFileSystem } from '../adapters/fs/node-file-system'
import { GithubTemplateProvider } from '../adapters/template-source/github-template-provider'
import { OfficialCatalog } from '../catalog/official-catalog'
import type { Catalog } from '../core/catalog/catalog'
import { CreateProjectInputValidator } from '../engine/create-project/create-project-input.validator'
import { CreateProjectUseCase } from '../engine/create-project/create-project.use-case'
import { ConflictDetector } from '../engine/plan/conflict-detector'
import { GenerationPlanner } from '../engine/plan/generation-planner'
import { OperationBuilder } from '../engine/plan/operation-builder'
import { OperationSorter } from '../engine/plan/operation-sorter'
import { TemplateScanner } from '../engine/plan/template-scanner'

export type App = {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const catalog = new OfficialCatalog()

  const fileSystem = new NodeFileSystem()
  const templateProvider = new GithubTemplateProvider(fileSystem)

  const generationPlanner = new GenerationPlanner(
    new TemplateScanner(fileSystem),
    new OperationBuilder(),
    new OperationSorter(),
    new ConflictDetector()
  )

  const createProjectUseCase = new CreateProjectUseCase(
    new CreateProjectInputValidator(),
    fileSystem,
    catalog,
    templateProvider,
    generationPlanner
  )

  return {
    catalog,
    createProjectUseCase,
  }
}
