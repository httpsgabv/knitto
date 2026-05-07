import type { MergeJsonOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class MergeJsonHandler implements OperationHandler<MergeJsonOperation> {
  readonly type = 'merge-json' as const

  async execute(
    operation: MergeJsonOperation,
    {
      jsonFileMerger,
    }: Parameters<OperationHandler<MergeJsonOperation>['execute']>[1]
  ) {
    await jsonFileMerger.merge(operation.source, operation.target)
  }
}
