import { NodeFileSystem } from "@adapters/fs/node-file-system"
import { NodeGitClient } from "@adapters/git/node-git-client"
import { PackageManagerResolver } from "@adapters/package-manager/package-manager-resolver"
import { ExecaShell } from "@adapters/shell/execa-shell"
import { FastGlobTemplateFileMatcher } from "@adapters/template-file-matcher/fast-glob-template-file-matcher"
import { GithubTemplateProvider } from "@adapters/template-source/github-template-provider"
import { TigedTemplateSourceResolver } from "@adapters/template-source/tiged-template-source-resolver"
import type { Catalog } from "@core/catalog/catalog"
import { ImportEditor } from "./ast/import-editor"
import { NestBootstrapEditor } from "./ast/nest-bootstrap-editor"
import { NestModuleEditor } from "./ast/nest-module-editor"
import { SourceFileEditor } from "./ast/source-file-editor"
import { TsMorphProjectFactory } from "./ast/ts-morph-project-factory"
import { createHandlers } from "./compose/handlers/create-handlers"
import type { OperationBaseContext } from "./compose/operation-context"
import { OperationExecutor } from "./compose/operation-executor"
import { TemplateComposer } from "./compose/template-composer"
import { VariableRenderer } from "./compose/variable-renderer"
import { CreateProjectInputValidator } from "./create-project/create-project-input.validator"
import { CreateProjectUseCase } from "./create-project/create-project.use-case"
import { ManifestFileFilter } from "./manifest/manifest-file-filter"
import { ManifestLoader } from "./manifest/manifest-loader"
import { ManifestReader } from "./manifest/manifest-reader"
import { ManifestValidator } from "./manifest/manifest-validator"
import { EnvMerger } from "./merge/env-merger"
import { JsonFileMerger } from "./merge/json-file-merger"
import { LineAppender } from "./merge/line-appender"
import { PackageJsonMerger } from "./merge/package-json-merger"
import { ReadmeMerger } from "./merge/readme-merger"
import { CompatibilityChecker } from "./plan/compatibility-checker"
import { ConflictDetector } from "./plan/conflict-detector"
import { FeatureResolver } from "./plan/feature-resolver"
import { GenerationPlanner } from "./plan/generation-planner"
import { createManifestOperationHandlers } from "./plan/handlers/create-manifest-operation-handlers"
import { ManifestOperationBuilder } from "./plan/manifest-operation-builder"
import { ManifestOperationPathResolver } from "./plan/manifest-operation-path-resolver"
import { ManifestOperationsExpander } from "./plan/manifest-operations-expander"
import { ManifestPlanningInputValidator } from "./plan/manifest-planning-input-validator"
import { OperationSorter } from "./plan/operation-sorter"
import { TemplateScanner } from "./plan/template-scanner"

export function createEngine(catalog: Catalog) {
  const fileSystem = new NodeFileSystem()
  const templateSourceResolver = new TigedTemplateSourceResolver()
  const templateProvider = new GithubTemplateProvider(
    fileSystem,
    templateSourceResolver
  )
  const templateScanner = new TemplateScanner(fileSystem)

  const variableRenderer = new VariableRenderer()
  const packageJsonMerger = new PackageJsonMerger(fileSystem)
  const jsonFileMerger = new JsonFileMerger(fileSystem)
  const envMerger = new EnvMerger(fileSystem)
  const lineAppender = new LineAppender(fileSystem)
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
    jsonFileMerger,
    envMerger,
    lineAppender,
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
    createProjectUseCase
  }
}