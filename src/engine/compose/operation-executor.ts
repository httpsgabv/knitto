import type { GenerationOperation } from '@core/generation/operation'
import type { OperationBaseContext, OperationContext } from './operation-context'
import type { OperationHandlerRegistry } from './operation-handler-registry'

export class OperationExecutor {
  constructor(
    private readonly handlers: OperationHandlerRegistry,
    private readonly baseContext: OperationBaseContext
  ) {}

  async execute(operation: GenerationOperation, variables: Record<string, string>) {
    const context: OperationContext = {
      ...this.baseContext,
      variables,
    }

    const handler = this.handlers.get(operation.type)
    if (!handler) {
      throw new Error(
        `No handler registered for operation type: ${operation.type}`
      )
    }

    await handler.execute(operation, context)
  }
}
