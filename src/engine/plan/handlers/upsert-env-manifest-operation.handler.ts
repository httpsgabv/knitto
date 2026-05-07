import { createId } from '@shared/ids'
import type { UpsertEnvManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class UpsertEnvManifestOperationHandler implements ManifestOperationHandler<UpsertEnvManifestOperation> {
  readonly type = 'upsert-env'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<UpsertEnvManifestOperation>) {
    return {
      id: createId('upsert-env'),
      type: 'upsert-env' as const,
      target: resolveTarget(operation.target),
      values: operation.values,
      origin,
      description,
    }
  }
}
