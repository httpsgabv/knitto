import type {
  AppendEnvManifestOperation,
  AppendReadmeManifestOperation,
  AstAddNamedImportManifestOperation,
  AstNestAddBootstrapCallManifestOperation,
  AstNestAddBootstrapMethodCallManifestOperation,
  AstNestAddBootstrapVariableManifestOperation,
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
      'ast.nest.add-bootstrap-variable': {
        type: 'ast.nest.add-bootstrap-variable',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AstNestAddBootstrapVariableManifestOperation>,
      'ast.nest.add-bootstrap-method-call': {
        type: 'ast.nest.add-bootstrap-method-call',
        build: () => ({}) as never,
      } satisfies ManifestOperationHandler<AstNestAddBootstrapMethodCallManifestOperation>,
    })

    expect(registry.get('copy-file')).toBe(handler)
  })
})
