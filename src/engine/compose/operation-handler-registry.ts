import type { GenerationOperation } from '@core/generation/operation'
import type { OperationHandler } from './operation-handler'

type SupportedOperationType = GenerationOperation['type']

export type OperationHandlerRecord = Partial<{
  [K in SupportedOperationType]: OperationHandler<Extract<GenerationOperation, { type: K }>>
}>

export class OperationHandlerRegistry {
  private readonly handlers: Map<
    SupportedOperationType,
    OperationHandler<GenerationOperation>
  >

  constructor(handlers: OperationHandlerRecord) {
    this.handlers = new Map()

    for (const handler of Object.values(handlers)) {
      if (!handler) {
        continue
      }

      this.handlers.set(
        handler.type,
        handler as OperationHandler<GenerationOperation>
      )
    }
  }

  get<T extends SupportedOperationType>(
    type: T
  ): OperationHandler<Extract<GenerationOperation, { type: T }>> | undefined {
    return this.handlers.get(type) as
      | OperationHandler<Extract<GenerationOperation, { type: T }>>
      | undefined
  }
}
