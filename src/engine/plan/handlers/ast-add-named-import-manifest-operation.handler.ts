import { createId } from '@shared/ids'
import type { AstAddNamedImportManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AstAddNamedImportManifestOperationHandler
  implements ManifestOperationHandler<AstAddNamedImportManifestOperation> {
  readonly type = 'ast.add-named-import'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstAddNamedImportManifestOperation>) {
    return {
      id: createId('ast-add-named-import'),
      type: 'ast.add-named-import' as const,
      target: resolveTarget(operation.target),
      named: operation.named,
      from: operation.from,
      origin,
      description,
    }
  }
}
