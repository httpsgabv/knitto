import type { GenerationOperation } from '@core/generation/operation'
import type { ManifestOperationBuildContext, ConcreteManifestOperation } from './manifest-operation-build-context'

export interface ManifestOperationHandler<T extends ConcreteManifestOperation> {
  type: T['type']
  build: (
    context: ManifestOperationBuildContext<T>
  ) => Extract<GenerationOperation, { type: T['type'] }>
}
