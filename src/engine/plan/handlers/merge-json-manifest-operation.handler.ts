import { createId } from '@shared/ids'
import type { MergeJsonManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class MergeJsonManifestOperationHandler implements ManifestOperationHandler<MergeJsonManifestOperation> {
  readonly type = 'merge-json'

  build({
    operation,
    description,
    origin,
    resolveSource,
    resolveTarget,
  }: ManifestOperationBuildContext<MergeJsonManifestOperation>) {
    return {
      id: createId('merge-json'),
      type: 'merge-json' as const,
      source: resolveSource(operation.source),
      target: resolveTarget(operation.target),
      strategy: operation.strategy,
      origin,
      description,
    }
  }
}
