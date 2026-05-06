import type { AstNestAddBootstrapMethodCallManifestOperation } from '@core/manifest/manifest-operation'
import { createId } from '@shared/ids'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AstNestAddBootstrapMethodCallManifestOperationHandler
  implements
    ManifestOperationHandler<AstNestAddBootstrapMethodCallManifestOperation>
{
  readonly type = 'ast.nest.add-bootstrap-method-call'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstNestAddBootstrapMethodCallManifestOperation>) {
    return {
      id: createId('ast-nest-add-bootstrap-method-call'),
      type: 'ast.nest.add-bootstrap-method-call' as const,
      target: resolveTarget(operation.target),
      receiver: operation.receiver,
      method: operation.method,
      arguments: operation.arguments,
      origin,
      description,
    }
  }
}
