import { NodeFileSystem } from '../adapters/fs/node-file-system'
import { NodeGitClient } from '../adapters/git/node-git-client'
import { PackageManagerResolver } from '../adapters/package-manager/package-manager-resolver'
import { ExecaShell } from '../adapters/shell/execa-shell'
import { GithubTemplateProvider } from '../adapters/template-source/github-template-provider'
import { OfficialCatalog } from '../catalog/official-catalog'
import type { Catalog } from '../core/catalog/catalog'
import { OperationExecutor } from '../engine/compose/operation-executor'
import { TemplateComposer } from '../engine/compose/template-composer'
import { VariableRenderer } from '../engine/compose/variable-renderer'
import { CreateProjectInputValidator } from '../engine/create-project/create-project-input.validator'
import { CreateProjectUseCase } from '../engine/create-project/create-project.use-case'
import { EnvMerger } from '../engine/merge/env-merger'
import { PackageJsonMerger } from '../engine/merge/package-json-merger'
import { ReadmeMerger } from '../engine/merge/readme-merger'
import { CompatibilityChecker } from '../engine/plan/compatibility-checker'
import { ConflictDetector } from '../engine/plan/conflict-detector'
import { FeatureResolver } from '../engine/plan/feature-resolver'
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
  const templateScanner = new TemplateScanner(fileSystem)

  const variableRenderer = new VariableRenderer()
  const packageJsonMerger = new PackageJsonMerger(fileSystem)
  const envMerger = new EnvMerger(fileSystem)
  const readmeMerger = new ReadmeMerger(fileSystem)
  const operationExecutor = new OperationExecutor(
    fileSystem,
    variableRenderer,
    packageJsonMerger,
    envMerger,
    readmeMerger
  )

  const templateComposer = new TemplateComposer(operationExecutor)

  const generationPlanner = new GenerationPlanner(
    templateScanner,
    new OperationBuilder(),
    new OperationSorter(),
    new ConflictDetector()
  )

  const createProjectInputValidator = new CreateProjectInputValidator()
  const featureResolver = new FeatureResolver(catalog)
  const compatibilityChecker = new CompatibilityChecker()

  const shell = new ExecaShell()
  const packageManagerResolver = new PackageManagerResolver(shell)
  const gitClient = new NodeGitClient(shell)

  const createProjectUseCase = new CreateProjectUseCase(
    createProjectInputValidator,
    catalog,
    featureResolver,
    compatibilityChecker,
    templateProvider,
    generationPlanner,
    templateComposer,
    packageManagerResolver,
    gitClient,
    fileSystem
  )

  return {
    catalog,
    createProjectUseCase,
  }
}
