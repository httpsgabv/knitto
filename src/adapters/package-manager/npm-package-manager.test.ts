import { describe, it, expect, beforeEach } from 'vitest'
import { NpmPackageManager } from './npm-package-manager'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'

describe('NpmPackageManager', () => {
  let fakeShell: FakeShell
  let packageManager: NpmPackageManager

  beforeEach(() => {
    fakeShell = new FakeShell()
    packageManager = new NpmPackageManager(fakeShell)
  })

  describe('install', () => {
    it('should call shell.run with npm install command', async () => {
      await packageManager.install('/some/project')

      const calls = fakeShell.getCallsByCommand('npm')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({
        command: 'npm',
        args: ['install'],
        options: { cwd: '/some/project' },
      })
    })

    it('should pass correct cwd to npm install', async () => {
      await packageManager.install('/path/to/my-project')

      const calls = fakeShell.getCalls()
      expect(calls).toHaveLength(1)
      expect(calls[0]?.options.cwd).toBe('/path/to/my-project')
    })
  })
})
