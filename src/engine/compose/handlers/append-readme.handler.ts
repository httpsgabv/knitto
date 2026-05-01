import type { AppendReadmeOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class AppendReadmeHandler
  implements OperationHandler<AppendReadmeOperation>
{
  readonly type = 'append-readme' as const

  async execute(
    operation: AppendReadmeOperation,
    { readmeMerger }: Parameters<
      OperationHandler<AppendReadmeOperation>['execute']
    >[1]
  ) {
    await readmeMerger.merge(
      operation.source,
      operation.target,
      operation.heading
    )
  }
}
