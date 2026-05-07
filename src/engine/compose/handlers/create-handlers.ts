import type { OperationHandlerRecord } from '../operation-handler-registry'
import { OperationHandlerRegistry } from '../operation-handler-registry'
import { AppendEnvHandler } from './append-env.handler'
import { AddPackageScriptsHandler } from './add-package-scripts.handler'
import { AppendLinesHandler } from './append-lines.handler'
import { AppendReadmeHandler } from './append-readme.handler'
import { AstAddNamedImportHandler } from './ast-add-named-import.handler'
import { AstAddSideEffectImportHandler } from './ast-add-side-effect-import.handler'
import { AstNestAddBootstrapCallHandler } from './ast-nest-add-bootstrap-call.handler'
import { AstNestAddBootstrapMethodCallHandler } from './ast-nest-add-bootstrap-method-call.handler'
import { AstNestAddBootstrapVariableHandler } from './ast-nest-add-bootstrap-variable.handler'
import { AstNestAddModuleImportHandler } from './ast-nest-add-module-import.handler'
import { CopyFileHandler } from './copy-file.handler'
import { MergePackageJsonHandler } from './merge-package-json.handler'
import { SkipFileHandler } from './skip-file.handler'
import { UpsertEnvHandler } from './upsert-env.handler'

export function createHandlers(): OperationHandlerRegistry {
  const handlers: OperationHandlerRecord = {
    'copy-file': new CopyFileHandler(),
    'merge-package-json': new MergePackageJsonHandler(),
    'add-package-scripts': new AddPackageScriptsHandler(),
    'append-env': new AppendEnvHandler(),
    'upsert-env': new UpsertEnvHandler(),
    'append-lines': new AppendLinesHandler(),
    'append-readme': new AppendReadmeHandler(),
    'skip-file': new SkipFileHandler(),
    'ast.add-named-import': new AstAddNamedImportHandler(),
    'ast.add-side-effect-import': new AstAddSideEffectImportHandler(),
    'ast.nest.add-module-import': new AstNestAddModuleImportHandler(),
    'ast.nest.add-bootstrap-call': new AstNestAddBootstrapCallHandler(),
    'ast.nest.add-bootstrap-method-call':
      new AstNestAddBootstrapMethodCallHandler(),
    'ast.nest.add-bootstrap-variable': new AstNestAddBootstrapVariableHandler(),
  }

  return new OperationHandlerRegistry(handlers)
}
