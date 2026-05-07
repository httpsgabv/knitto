import { describe, expect, it } from 'vitest'
import { createManifestOperationHandlers } from './create-manifest-operation-handlers'

describe('manifest operation handlers', () => {
  it('registers handlers for every supported manifest operation type', () => {
    const handlers = createManifestOperationHandlers()

    expect(handlers.get('copy-file')?.type).toBe('copy-file')
    expect(handlers.get('merge-package-json')?.type).toBe('merge-package-json')
    expect(handlers.get('append-env')?.type).toBe('append-env')
    expect(handlers.get('upsert-env')?.type).toBe('upsert-env')
    expect(handlers.get('append-readme')?.type).toBe('append-readme')
    expect(handlers.get('ast.add-named-import')?.type).toBe(
      'ast.add-named-import'
    )
    expect(handlers.get('ast.nest.add-module-import')?.type).toBe(
      'ast.nest.add-module-import'
    )
    expect(handlers.get('ast.nest.add-bootstrap-call')?.type).toBe(
      'ast.nest.add-bootstrap-call'
    )
    expect(handlers.get('ast.nest.add-bootstrap-variable')?.type).toBe(
      'ast.nest.add-bootstrap-variable'
    )
    expect(handlers.get('ast.nest.add-bootstrap-method-call')?.type).toBe(
      'ast.nest.add-bootstrap-method-call'
    )
  })
})
