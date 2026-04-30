import fs from 'fs-extra'
import fg from 'fast-glob'
import type { FileSystem } from './file-system'
import { normalizeSlashes } from '../../shared/paths'

export class NodeFileSystem implements FileSystem {
  async ensureDir(path: string): Promise<void> {
    await fs.ensureDir(path)
  }

  async readFile(path: string, encoding: BufferEncoding): Promise<string> {
    return fs.readFile(path, encoding)
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fs.outputFile(path, content)
  }

  async readJson<T>(path: string): Promise<T> {
    return fs.readJson(path) as Promise<T>
  }

  async writeJson(path: string, value: unknown): Promise<void> {
    await fs.outputJson(path, value, { spaces: 2 })
  }

  async pathExists(path: string): Promise<boolean> {
    return fs.pathExists(path)
  }

  async listFiles(root: string): Promise<string[]> {
    const files = await fg('**/*', { cwd: root, dot: true, onlyFiles: true })
    return files.map(normalizeSlashes)
  }
}
