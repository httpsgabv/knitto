import { describe, it, expect, beforeEach } from 'vitest'
import { NodeGitClient } from './node-git-client'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'

describe('NodeGitClient', () => {
  let fakeShell: FakeShell
  let gitClient: NodeGitClient

  beforeEach(() => {
    fakeShell = new FakeShell()
    gitClient = new NodeGitClient(fakeShell)
  })

  describe('init', () => {
    it('should call shell.run with git init command', async () => {
      await gitClient.init('/some/project')

      const calls = fakeShell.getCallsByCommand('git')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({
        command: 'git',
        args: ['init'],
        options: { cwd: '/some/project' },
      })
    })
  })
})
