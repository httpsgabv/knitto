import { createId } from '@shared/ids'
import type { AppendLinesManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AppendLinesManifestOperationHandler implements ManifestOperationHandler<AppendLinesManifestOperation> {
  readonly type = 'append-lines'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AppendLinesManifestOperation>) {
    return {
      id: createId('append-lines'),
      type: 'append-lines' as const,
      target: resolveTarget(operation.target),
      lines: operation.lines,
      origin,
      description,
    }
  }
}
