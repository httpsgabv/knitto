import { describe, it, expect, beforeEach } from 'vitest'
import { PnpmPackageManager } from './pnpm-package-manager'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'

describe('PnpmPackageManager', () => {
  let fakeShell: FakeShell
  let packageManager: PnpmPackageManager

  beforeEach(() => {
    fakeShell = new FakeShell()
    packageManager = new PnpmPackageManager(fakeShell)
  })

  describe('install', () => {
    it('should call shell.run with pnpm install command', async () => {
      await packageManager.install('/some/project')

      const calls = fakeShell.getCallsByCommand('pnpm')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({
        command: 'pnpm',
        args: ['install'],
        options: { cwd: '/some/project' },
      })
    })
  })
})
