import { createId } from '@shared/ids'
import type { AstNestAddModuleImportManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AstNestAddModuleImportManifestOperationHandler
  implements ManifestOperationHandler<AstNestAddModuleImportManifestOperation> {
  readonly type = 'ast.nest.add-module-import'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstNestAddModuleImportManifestOperation>) {
    return {
      id: createId('ast-nest-add-module-import'),
      type: 'ast.nest.add-module-import' as const,
      target: resolveTarget(operation.target),
      namedImport: {
        name: operation.import.named,
        from: operation.import.from,
      },
      moduleName: operation.moduleName,
      origin,
      description,
    }
  }
}
