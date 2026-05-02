import type { GenerationOperation } from '@core/generation/operation'
import type { OperationContext } from './operation-context'

export interface OperationHandler<T extends GenerationOperation> {
  type: T['type']
  execute: (operation: T, context: OperationContext) => Promise<void>
}
