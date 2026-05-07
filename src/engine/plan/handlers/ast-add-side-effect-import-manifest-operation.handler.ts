import type { AstAddSideEffectImportManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationHandler } from '../manifest-operation-handler'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { createId } from '@shared/ids'

export class AstAddSideEffectImportManifestOperationHandler implements ManifestOperationHandler<AstAddSideEffectImportManifestOperation> {
  readonly type = 'ast.add-side-effect-import'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AstAddSideEffectImportManifestOperation>) {
    return {
      id: createId('ast-add-side-effect-import'),
      type: 'ast.add-side-effect-import' as const,
      target: resolveTarget(operation.target),
      from: operation.from,
      position: operation.position,
      origin,
      description,
    }
  }
}
