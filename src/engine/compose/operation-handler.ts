import type { FileOperation } from '@core/generation/file-operation'
import type { ExecutionContext } from './handlers/execution-context'

export interface OperationHandler<T extends FileOperation> {
  type: T['type']
  execute: (operation: T, context: ExecutionContext) => Promise<void>
}
