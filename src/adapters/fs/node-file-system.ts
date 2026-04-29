import fs from 'fs-extra'
import fg from 'fast-glob'
import type { FileSystem } from './file-system'
import { normalizeSlashes } from '../../shared/paths'

export class NodeFileSystem implements FileSystem {
  async listFiles(root: string): Promise<string[]> {
    const files = await fg('**/*', { cwd: root, dot: true, onlyFiles: true })
    return files.map(normalizeSlashes)
  }

  async ensureDir(path: string): Promise<void> {
    await fs.ensureDir(path)
  }

  async pathExists(path: string): Promise<boolean> {
    return fs.pathExists(path)
  }
}
