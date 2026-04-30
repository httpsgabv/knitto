import { describe, it, expect, beforeEach } from 'vitest'
import { YarnPackageManager } from './yarn-package-manager'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'

describe('YarnPackageManager', () => {
  let fakeShell: FakeShell
  let packageManager: YarnPackageManager

  beforeEach(() => {
    fakeShell = new FakeShell()
    packageManager = new YarnPackageManager(fakeShell)
  })

  describe('install', () => {
    it('should call shell.run with yarn install command', async () => {
      await packageManager.install('/some/project')

      const calls = fakeShell.getCallsByCommand('yarn')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({
        command: 'yarn',
        args: ['install'],
        options: { cwd: '/some/project' },
      })
    })

    it('should pass correct cwd to yarn install', async () => {
      await packageManager.install('/path/to/my-project')

      const calls = fakeShell.getCalls()
      expect(calls).toHaveLength(1)
      expect(calls[0]?.options.cwd).toBe('/path/to/my-project')
    })
  })
})
