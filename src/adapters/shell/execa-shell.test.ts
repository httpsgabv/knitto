import { describe, it, expect, vi, beforeEach } from 'vitest'
import { execa } from 'execa'
import { ExecaShell } from './execa-shell'

vi.mock('execa')

describe('ExecaShell', () => {
  let shell: ExecaShell

  beforeEach(() => {
    shell = new ExecaShell()
    vi.clearAllMocks()
  })

  describe('run', () => {
    it('should call execa with command, args and options', async () => {
      vi.mocked(execa).mockResolvedValue(undefined as never)

      await shell.run('git', ['init'], { cwd: '/some/project' })

      expect(execa).toHaveBeenCalledWith('git', ['init'], {
        cwd: '/some/project',
        stdio: 'inherit',
      })
    })
  })
})
