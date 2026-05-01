import type { MergePackageJsonOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class MergePackageJsonHandler
  implements OperationHandler<MergePackageJsonOperation>
{
  readonly type = 'merge-package-json' as const

  async execute(
    operation: MergePackageJsonOperation,
    { packageJsonMerger }: Parameters<
      OperationHandler<MergePackageJsonOperation>['execute']
    >[1]
  ) {
    await packageJsonMerger.merge(operation.source, operation.target)
  }
}
