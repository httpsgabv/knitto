import type { ManifestOperationHandlerRecord } from '../manifest-operation-handler-registry'
import { ManifestOperationHandlerRegistry } from '../manifest-operation-handler-registry'
import { AppendEnvManifestOperationHandler } from './append-env-manifest-operation.handler'
import { AppendReadmeManifestOperationHandler } from './append-readme-manifest-operation.handler'
import { AstAddNamedImportManifestOperationHandler } from './ast-add-named-import-manifest-operation.handler'
import { AstNestAddModuleImportManifestOperationHandler } from './ast-nest-add-module-import-manifest-operation.handler'
import { CopyFileManifestOperationHandler } from './copy-file-manifest-operation.handler'
import { MergePackageJsonManifestOperationHandler } from './merge-package-json-manifest-operation.handler'

export function createManifestOperationHandlers(): ManifestOperationHandlerRegistry {
  const handlers: ManifestOperationHandlerRecord = {
    'copy-file': new CopyFileManifestOperationHandler(),
    'merge-package-json': new MergePackageJsonManifestOperationHandler(),
    'append-env': new AppendEnvManifestOperationHandler(),
    'append-readme': new AppendReadmeManifestOperationHandler(),
    'ast.add-named-import': new AstAddNamedImportManifestOperationHandler(),
    'ast.nest.add-module-import':
      new AstNestAddModuleImportManifestOperationHandler(),
  }

  return new ManifestOperationHandlerRegistry(handlers)
}
