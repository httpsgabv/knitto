import type { AppendLinesOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class AppendLinesHandler implements OperationHandler<AppendLinesOperation> {
  readonly type = 'append-lines' as const

  async execute(
    operation: AppendLinesOperation,
    {
      lineAppender,
    }: Parameters<OperationHandler<AppendLinesOperation>['execute']>[1]
  ) {
    await lineAppender.appendMissing(operation.target, operation.lines)
  }
}
