import { createId } from '@shared/ids'
import type { AppendReadmeManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AppendReadmeManifestOperationHandler
  implements ManifestOperationHandler<AppendReadmeManifestOperation> {
  readonly type = 'append-readme'

  build({
    operation,
    description,
    origin,
    resolveSource,
    resolveTarget,
  }: ManifestOperationBuildContext<AppendReadmeManifestOperation>) {
    return {
      id: createId('append-readme'),
      type: 'append-readme' as const,
      source: resolveSource(operation.source),
      target: resolveTarget(operation.target),
      heading: operation.heading,
      origin,
      description,
    }
  }
}
