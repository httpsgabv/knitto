import type { SkipFileOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class SkipFileHandler implements OperationHandler<SkipFileOperation> {
  readonly type = 'skip-file' as const

  async execute(
    _operation: SkipFileOperation,
    _context: Parameters<OperationHandler<SkipFileOperation>['execute']>[1]
  ): Promise<void> {
    void _operation
    void _context
  }
}
