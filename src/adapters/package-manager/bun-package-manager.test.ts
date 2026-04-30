import { describe, it, expect, beforeEach } from 'vitest'
import { BunPackageManager } from './bun-package-manager'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'

describe('BunPackageManager', () => {
  let fakeShell: FakeShell
  let packageManager: BunPackageManager

  beforeEach(() => {
    fakeShell = new FakeShell()
    packageManager = new BunPackageManager(fakeShell)
  })

  describe('install', () => {
    it('should call shell.run with bun install command', async () => {
      await packageManager.install('/some/project')

      const calls = fakeShell.getCallsByCommand('bun')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({
        command: 'bun',
        args: ['install'],
        options: { cwd: '/some/project' },
      })
    })

    it('should pass correct cwd to bun install', async () => {
      await packageManager.install('/path/to/my-project')

      const calls = fakeShell.getCalls()
      expect(calls).toHaveLength(1)
      expect(calls[0]?.options.cwd).toBe('/path/to/my-project')
    })
  })
})
