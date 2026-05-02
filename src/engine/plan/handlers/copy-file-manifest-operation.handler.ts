import { createId } from '@shared/ids'
import type { CopyFileManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class CopyFileManifestOperationHandler
  implements ManifestOperationHandler<CopyFileManifestOperation> {
  readonly type = 'copy-file'

  build({
    operation,
    description,
    origin,
    resolveSource,
    resolveTarget,
  }: ManifestOperationBuildContext<CopyFileManifestOperation>) {
    return {
      id: createId('copy'),
      type: 'copy-file' as const,
      source: resolveSource(operation.source),
      target: resolveTarget(operation.target),
      overwrite: operation.overwrite,
      renderVariables: operation.renderVariables,
      origin,
      description,
    }
  }
}
