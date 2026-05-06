import { createId } from '@shared/ids'
import type { AstNestAddBootstrapCallManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AstNestAddBootstrapCallManifestOperationHandler implements ManifestOperationHandler<AstNestAddBootstrapCallManifestOperation> {
  readonly type = 'ast.nest.add-bootstrap-call'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstNestAddBootstrapCallManifestOperation>) {
    console.log(this.type)
    return {
      id: createId('ast-nest-add-bootstrap-call'),
      type: 'ast.nest.add-bootstrap-call' as const,
      target: resolveTarget(operation.target),
      appVar: operation.appVar,
      call: operation.call,
      origin,
      description,
    }
  }
}
