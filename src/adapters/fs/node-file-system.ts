import fs from 'fs-extra'
import type { FileSystem } from './file-system'

export class NodeFileSystem implements FileSystem {
  async ensureDir(path: string): Promise<void> {
    await fs.ensureDir(path)
  }

  async pathExists(path: string): Promise<boolean> {
    return fs.pathExists(path)
  }
}
