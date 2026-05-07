import type { ManifestOperationHandlerRecord } from '../manifest-operation-handler-registry'
import { ManifestOperationHandlerRegistry } from '../manifest-operation-handler-registry'
import { AppendEnvManifestOperationHandler } from './append-env-manifest-operation.handler'
import { AppendLinesManifestOperationHandler } from './append-lines-manifest-operation.handler'
import { AddPackageScriptsManifestOperationHandler } from './add-package-scripts-manifest-operation.handler'
import { AppendReadmeManifestOperationHandler } from './append-readme-manifest-operation.handler'
import { AstAddNamedImportManifestOperationHandler } from './ast-add-named-import-manifest-operation.handler'
import { AstAddSideEffectImportManifestOperationHandler } from './ast-add-side-effect-import-manifest-operation.handler'
import { AstNestAddBootstrapCallManifestOperationHandler } from './ast-nest-add-bootstrap-call-manifest-operation.handler'
import { AstNestAddBootstrapMethodCallManifestOperationHandler } from './ast-nest-add-bootstrap-method-call-manifest-operation.handler'
import { AstNestAddBootstrapVariableManifestOperationHandler } from './ast-nest-add-bootstrap-variable-manifest-operation.handler'
import { AstNestAddModuleImportManifestOperationHandler } from './ast-nest-add-module-import-manifest-operation.handler'
import { CopyFileManifestOperationHandler } from './copy-file-manifest-operation.handler'
import { MergePackageJsonManifestOperationHandler } from './merge-package-json-manifest-operation.handler'
import { MergeJsonManifestOperationHandler } from './merge-json-manifest-operation.handler'
import { UpsertEnvManifestOperationHandler } from './upsert-env-manifest-operation.handler'

export function createManifestOperationHandlers(): ManifestOperationHandlerRegistry {
  const handlers: ManifestOperationHandlerRecord = {
    'copy-file': new CopyFileManifestOperationHandler(),
    'merge-package-json': new MergePackageJsonManifestOperationHandler(),
    'merge-json': new MergeJsonManifestOperationHandler(),
    'append-env': new AppendEnvManifestOperationHandler(),
    'upsert-env': new UpsertEnvManifestOperationHandler(),
    'append-lines': new AppendLinesManifestOperationHandler(),
    'add-package-scripts': new AddPackageScriptsManifestOperationHandler(),
    'append-readme': new AppendReadmeManifestOperationHandler(),
    'ast.add-named-import': new AstAddNamedImportManifestOperationHandler(),
    'ast.add-side-effect-import':
      new AstAddSideEffectImportManifestOperationHandler(),
    'ast.nest.add-module-import':
      new AstNestAddModuleImportManifestOperationHandler(),
    'ast.nest.add-bootstrap-call':
      new AstNestAddBootstrapCallManifestOperationHandler(),
    'ast.nest.add-bootstrap-variable':
      new AstNestAddBootstrapVariableManifestOperationHandler(),
    'ast.nest.add-bootstrap-method-call':
      new AstNestAddBootstrapMethodCallManifestOperationHandler(),
  }

  return new ManifestOperationHandlerRegistry(handlers)
}
