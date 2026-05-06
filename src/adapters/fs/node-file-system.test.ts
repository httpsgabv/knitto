import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { NodeFileSystem } from './node-file-system'

vi.mock('fs-extra')
vi.mock('fast-glob')

describe('NodeFileSystem', () => {
  let fileSystem: NodeFileSystem

  beforeEach(() => {
    fileSystem = new NodeFileSystem()
    vi.clearAllMocks()
  })

  describe('ensureDir', () => {
    it('should call fs.ensureDir with the given path', async () => {
      const spy = vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined)

      await fileSystem.ensureDir('/some/path')

      expect(spy).toHaveBeenCalledWith('/some/path')
    })
  })

  describe('readFile', () => {
    it('should call fs.readFile with path and encoding', async () => {
      const spy = vi
        .spyOn(fs, 'readFile')
        .mockResolvedValue('file content' as never)

      const result = await fileSystem.readFile('/some/file.txt', 'utf-8')

      expect(spy).toHaveBeenCalledWith('/some/file.txt', 'utf-8')
      expect(result).toBe('file content')
    })
  })

  describe('writeFile', () => {
    it('should call fs.outputFile with path and content', async () => {
      const spy = vi.spyOn(fs, 'outputFile').mockResolvedValue(undefined)

      await fileSystem.writeFile('/some/file.txt', 'file content')

      expect(spy).toHaveBeenCalledWith('/some/file.txt', 'file content')
    })
  })

  describe('readJson', () => {
    it('should call fs.readJson and return parsed value', async () => {
      const mockData = { name: 'test', value: 123 }
      const spy = vi.spyOn(fs, 'readJson').mockResolvedValue(mockData)

      const result =
        await fileSystem.readJson<typeof mockData>('/some/file.json')

      expect(spy).toHaveBeenCalledWith('/some/file.json')
      expect(result).toEqual(mockData)
    })
  })

  describe('writeJson', () => {
    it('should call fs.outputJson with path, value and spaces option', async () => {
      const spy = vi.spyOn(fs, 'outputJson').mockResolvedValue(undefined)

      await fileSystem.writeJson('/some/file.json', { name: 'test' })

      expect(spy).toHaveBeenCalledWith(
        '/some/file.json',
        { name: 'test' },
        { spaces: 2 }
      )
    })
  })

  describe('pathExists', () => {
    it('should call fs.pathExists and return true', async () => {
      const spy = vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never)

      const result = await fileSystem.pathExists('/some/path')

      expect(spy).toHaveBeenCalledWith('/some/path')
      expect(result).toBe(true)
    })

    it('should return false when path does not exist', async () => {
      const spy = vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never)

      const result = await fileSystem.pathExists('/nonexistent')

      expect(spy).toHaveBeenCalledWith('/nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('listFiles', () => {
    it('should call fast-glob with correct options and normalize slashes', async () => {
      vi.mocked(fg).mockResolvedValue([
        'path\\to\\file.txt',
        'another\\file.md',
      ])

      const result = await fileSystem.listFiles('/some/root')

      expect(fg).toHaveBeenCalledWith('**/*', {
        cwd: '/some/root',
        dot: true,
        onlyFiles: true,
      })
      expect(result).toEqual(['path/to/file.txt', 'another/file.md'])
    })

    it('normalizes Windows-style glob results before returning them', async () => {
      vi.mocked(fg).mockResolvedValue([
        'src\\auth\\controller.ts',
        '.well-known\\config.json',
      ])

      await expect(fileSystem.listFiles('C:\\repo\\template')).resolves.toEqual([
        'src/auth/controller.ts',
        '.well-known/config.json',
      ])
    })

    it('should return empty array when no files found', async () => {
      vi.mocked(fg).mockResolvedValue([])

      const result = await fileSystem.listFiles('/empty/root')

      expect(fg).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
})
