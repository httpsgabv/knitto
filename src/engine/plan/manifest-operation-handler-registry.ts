import type { ManifestOperationHandler } from './manifest-operation-handler'
import type { ConcreteManifestOperation } from './manifest-operation-build-context'

type SupportedManifestOperationType = ConcreteManifestOperation['type']

export type ManifestOperationHandlerRecord = {
  [K in SupportedManifestOperationType]: ManifestOperationHandler<
    Extract<ConcreteManifestOperation, { type: K }>
  >
}

export class ManifestOperationHandlerRegistry {
  private readonly handlers: Map<
    SupportedManifestOperationType,
    ManifestOperationHandler<ConcreteManifestOperation>
  >

  constructor(handlers: ManifestOperationHandlerRecord) {
    this.handlers = new Map(
      Object.values(handlers).map((handler) => [
        handler.type,
        handler as ManifestOperationHandler<ConcreteManifestOperation>,
      ])
    )
  }

  get<T extends SupportedManifestOperationType>(
    type: T
  ):
    | ManifestOperationHandler<Extract<ConcreteManifestOperation, { type: T }>>
    | undefined {
    return this.handlers.get(type) as
      | ManifestOperationHandler<
          Extract<ConcreteManifestOperation, { type: T }>
        >
      | undefined
  }
}
