import { createId } from '@shared/ids'
import type { AppendEnvManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AppendEnvManifestOperationHandler
  implements ManifestOperationHandler<AppendEnvManifestOperation> {
  readonly type = 'append-env'

  build({
    operation,
    description,
    origin,
    resolveSource,
    resolveTarget,
  }: ManifestOperationBuildContext<AppendEnvManifestOperation>) {
    return {
      id: createId('append-env'),
      type: 'append-env' as const,
      source: resolveSource(operation.source),
      target: resolveTarget(operation.target),
      strategy: operation.strategy,
      origin,
      description,
    }
  }
}
