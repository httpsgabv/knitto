import type { OperationHandlerRecord } from '../operation-handler-registry'
import { OperationHandlerRegistry } from '../operation-handler-registry'
import { AppendEnvHandler } from './append-env.handler'
import { AppendReadmeHandler } from './append-readme.handler'
import { AstAddNamedImportHandler } from './ast-add-named-import.handler'
import { AstNestAddModuleImportHandler } from './ast-nest-add-module-import.handler'
import { CopyFileHandler } from './copy-file.handler'
import { MergePackageJsonHandler } from './merge-package-json.handler'
import { SkipFileHandler } from './skip-file.handler'

export function createHandlers(): OperationHandlerRegistry {
  const handlers: OperationHandlerRecord = {
    'copy-file': new CopyFileHandler(),
    'merge-package-json': new MergePackageJsonHandler(),
    'append-env': new AppendEnvHandler(),
    'append-readme': new AppendReadmeHandler(),
    'skip-file': new SkipFileHandler(),
    'ast.add-named-import': new AstAddNamedImportHandler(),
    'ast.nest.add-module-import': new AstNestAddModuleImportHandler(),
  }

  return new OperationHandlerRegistry(handlers)
}
