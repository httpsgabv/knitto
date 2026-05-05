import { describe, expect, it } from 'vitest'
import { OperationHandlerRegistry } from './operation-handler-registry'

describe('OperationHandlerRegistry', () => {
  it('allows compose to register only implemented handlers', () => {
    const copyHandler = {
      type: 'copy-file' as const,
      execute: async () => undefined,
    }

    const registry = new OperationHandlerRegistry({
      'copy-file': copyHandler,
    })

    expect(registry.get('copy-file')).toBe(copyHandler)
    expect(registry.get('ast.nest.add-bootstrap-call')).toBeUndefined()
  })
})
