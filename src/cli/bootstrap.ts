import { NodeFileSystem } from '../adapters/fs/node-file-system'
import { NodeGitClient } from '../adapters/git/node-git-client'
import { PackageManagerResolver } from '../adapters/package-manager/package-manager-resolver'
import { ExecaShell } from '../adapters/shell/execa-shell'
import { FastGlobTemplateFileMatcher } from '@adapters/template-file-matcher/fast-glob-template-file-matcher'
import { GithubTemplateProvider } from '@adapters/template-source/github-template-provider'
import { TigedTemplateSourceResolver } from '@adapters/template-source/tiged-template-source-resolver'
import { OfficialCatalog } from '@catalog/official-catalog'
import type { Catalog } from '@core/catalog/catalog'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { createHandlers } from '@engine/compose/handlers/create-handlers'
import type { OperationBaseContext } from '@engine/compose/operation-context'
import { OperationExecutor } from '@engine/compose/operation-executor'
import { TemplateComposer } from '@engine/compose/template-composer'
import { VariableRenderer } from '@engine/compose/variable-renderer'
import { CreateProjectInputValidator } from '@engine/create-project/create-project-input.validator'
import { CreateProjectUseCase } from '@engine/create-project/create-project.use-case'
import { ManifestFileFilter } from '@engine/manifest/manifest-file-filter'
import { ManifestLoader } from '@engine/manifest/manifest-loader'
import { ManifestReader } from '@engine/manifest/manifest-reader'
import { ManifestValidator } from '@engine/manifest/manifest-validator'
import { EnvMerger } from '@engine/merge/env-merger'
import { PackageJsonMerger } from '@engine/merge/package-json-merger'
import { ReadmeMerger } from '@engine/merge/readme-merger'
import { CompatibilityChecker } from '@engine/plan/compatibility-checker'
import { ConflictDetector } from '@engine/plan/conflict-detector'
import { FeatureResolver } from '@engine/plan/feature-resolver'
import { GenerationPlanner } from '@engine/plan/generation-planner'
import { createManifestOperationHandlers } from '@engine/plan/handlers/create-manifest-operation-handlers'
import { ManifestOperationBuilder } from '@engine/plan/manifest-operation-builder'
import { ManifestOperationPathResolver } from '@engine/plan/manifest-operation-path-resolver'
import { ManifestOperationsExpander } from '@engine/plan/manifest-operations-expander'
import { ManifestPlanningInputValidator } from '@engine/plan/manifest-planning-input-validator'
import { OperationSorter } from '@engine/plan/operation-sorter'
import { TemplateScanner } from '@engine/plan/template-scanner'

export type App = {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const catalog = new OfficialCatalog()

  const fileSystem = new NodeFileSystem()
  const templateSourceResolver = new TigedTemplateSourceResolver()
  const templateProvider = new GithubTemplateProvider(
    fileSystem,
    templateSourceResolver
  )
  const templateScanner = new TemplateScanner(fileSystem)

  const variableRenderer = new VariableRenderer()
  const packageJsonMerger = new PackageJsonMerger(fileSystem)
  const envMerger = new EnvMerger(fileSystem)
  const readmeMerger = new ReadmeMerger(fileSystem)
  const manifestReader = new ManifestReader(fileSystem)
  const manifestValidator = new ManifestValidator()
  const manifestLoader = new ManifestLoader(manifestReader, manifestValidator)
  const tsMorphProjectFactory = new TsMorphProjectFactory()
  const sourceFileEditor = new SourceFileEditor(tsMorphProjectFactory)
  const importEditor = new ImportEditor()
  const nestModuleEditor = new NestModuleEditor(importEditor)
  const nestBootstrapEditor = new NestBootstrapEditor()
  const operationHandlers = createHandlers()
  const operationBaseContext: OperationBaseContext = {
    fileSystem,
    variableRenderer,
    packageJsonMerger,
    envMerger,
    readmeMerger,
    sourceFileEditor,
    importEditor,
    nestModuleEditor,
    nestBootstrapEditor,
  }
  const operationExecutor = new OperationExecutor(
    operationHandlers,
    operationBaseContext
  )

  const templateComposer = new TemplateComposer(operationExecutor)
  const manifestOperationBuilder = new ManifestOperationBuilder(
    createManifestOperationHandlers(),
    new ManifestOperationPathResolver()
  )
  const templateFileMatcher = new FastGlobTemplateFileMatcher()

  const generationPlanner = new GenerationPlanner(
    templateScanner,
    new OperationSorter(),
    new ConflictDetector(),
    new ManifestFileFilter(templateFileMatcher),
    new ManifestPlanningInputValidator(),
    new ManifestOperationsExpander(manifestOperationBuilder)
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
    manifestLoader,
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
