import type { UpsertEnvOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class UpsertEnvHandler implements OperationHandler<UpsertEnvOperation> {
  readonly type = 'upsert-env' as const

  async execute(
    operation: UpsertEnvOperation,
    {
      envMerger,
    }: Parameters<OperationHandler<UpsertEnvOperation>['execute']>[1]
  ) {
    await envMerger.upsert(operation.target, operation.values)
  }
}
