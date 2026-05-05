import type {
  AppendEnvManifestOperation,
  AppendReadmeManifestOperation,
  AstAddNamedImportManifestOperation,
  AstNestAddBootstrapCallManifestOperation,
  AstNestAddModuleImportManifestOperation,
  CopyFileManifestOperation,
  MergePackageJsonManifestOperation,
} from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationHandler } from './manifest-operation-handler'
import { ManifestOperationHandlerRegistry } from './manifest-operation-handler-registry'

describe('ManifestOperationHandlerRegistry', () => {
  it('returns the registered handler for a concrete manifest operation type', () => {
    const handler = {
      type: 'copy-file',
      build: () => ({}) as never,
    } satisfies ManifestOperationHandler<CopyFileManifestOperation>

    const registry = new ManifestOperationHandlerRegistry({
      'copy-file': handler,
      'merge-package-json': {
        type: 'merge-package-json',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<MergePackageJsonManifestOperation>,
      'append-env': {
        type: 'append-env',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AppendEnvManifestOperation>,
      'append-readme': {
        type: 'append-readme',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AppendReadmeManifestOperation>,
      'ast.add-named-import': {
        type: 'ast.add-named-import',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AstAddNamedImportManifestOperation>,
      'ast.nest.add-module-import': {
        type: 'ast.nest.add-module-import',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AstNestAddModuleImportManifestOperation>,
      'ast.nest.add-bootstrap-call': {
        type: 'ast.nest.add-bootstrap-call',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AstNestAddBootstrapCallManifestOperation>,
    })

    expect(registry.get('copy-file')).toBe(handler)
  })
})
