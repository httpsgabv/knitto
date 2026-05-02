import { createId } from '@shared/ids'
import type { MergePackageJsonManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class MergePackageJsonManifestOperationHandler
  implements ManifestOperationHandler<MergePackageJsonManifestOperation> {
  readonly type = 'merge-package-json'

  build({
    operation,
    description,
    origin,
    resolveSource,
    resolveTarget,
  }: ManifestOperationBuildContext<MergePackageJsonManifestOperation>) {
    return {
      id: createId('merge-package-json'),
      type: 'merge-package-json' as const,
      source: resolveSource(operation.source),
      target: resolveTarget(operation.target),
      strategy: operation.strategy,
      origin,
      description,
    }
  }
}
