import { describe, expect, it } from 'vitest'
import { createHandlers } from './create-handlers'

describe('createHandlers', () => {
  it('registers a handler for each supported operation type', () => {
    const handlers = createHandlers()

    expect(handlers.get('copy-file')?.type).toBe('copy-file')
    expect(handlers.get('merge-package-json')?.type).toBe('merge-package-json')
    expect(handlers.get('append-env')?.type).toBe('append-env')
    expect(handlers.get('append-readme')?.type).toBe('append-readme')
    expect(handlers.get('skip-file')?.type).toBe('skip-file')
    expect(handlers.get('ast.add-named-import')?.type).toBe('ast.add-named-import')
    expect(handlers.get('ast.nest.add-module-import')?.type).toBe(
      'ast.nest.add-module-import'
    )
  })
})
