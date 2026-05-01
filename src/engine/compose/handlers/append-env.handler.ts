import type { AppendEnvOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class AppendEnvHandler implements OperationHandler<AppendEnvOperation> {
  readonly type = 'append-env' as const

  async execute(
    operation: AppendEnvOperation,
    { envMerger }: Parameters<OperationHandler<AppendEnvOperation>['execute']>[1]
  ) {
    await envMerger.merge(operation.source, operation.target)
  }
}
