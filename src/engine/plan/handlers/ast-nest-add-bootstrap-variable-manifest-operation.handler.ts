import { createId } from '@shared/ids'
import type { AstNestAddBootstrapVariableManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AstNestAddBootstrapVariableManifestOperationHandler
  implements
    ManifestOperationHandler<AstNestAddBootstrapVariableManifestOperation>
{
  readonly type = 'ast.nest.add-bootstrap-variable'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstNestAddBootstrapVariableManifestOperation>) {
    return {
      id: createId('ast-nest-add-bootstrap-variable'),
      type: 'ast.nest.add-bootstrap-variable' as const,
      target: resolveTarget(operation.target),
      declarationKind: operation.declarationKind,
      name: operation.name,
      initializer: operation.initializer,
      origin,
      description,
    }
  }
}
