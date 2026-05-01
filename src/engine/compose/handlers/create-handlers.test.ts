import { describe, expect, it, vi } from 'vitest'
import type { FileSystem } from '@adapters/fs/file-system'
import type { PackageJsonMerger } from '@engine/merge/package-json-merger'
import type { EnvMerger } from '@engine/merge/env-merger'
import type { ReadmeMerger } from '@engine/merge/readme-merger'
import { VariableRenderer } from '../variable-renderer'
import { createHandlers } from './create-handlers'

describe('createHandlers', () => {
  it('should register a handler for each file operation type', () => {
    const handlers = createHandlers({
      fileSystem: {} as FileSystem,
      variableRenderer: new VariableRenderer(),
      packageJsonMerger: {
        merge: vi.fn(),
      } as unknown as PackageJsonMerger,
      envMerger: { merge: vi.fn() } as unknown as EnvMerger,
      readmeMerger: { merge: vi.fn() } as unknown as ReadmeMerger,
      variables: {},
    })

    expect(handlers.get('copy-file')?.type).toBe('copy-file')
    expect(handlers.get('merge-package-json')?.type).toBe('merge-package-json')
    expect(handlers.get('append-env')?.type).toBe('append-env')
    expect(handlers.get('append-readme')?.type).toBe('append-readme')
    expect(handlers.get('skip-file')?.type).toBe('skip-file')
  })
})
