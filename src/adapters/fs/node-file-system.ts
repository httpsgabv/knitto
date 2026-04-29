import fs from 'fs-extra'
import type { FileSystem } from './file-system'

export class NodeFileSystem implements FileSystem {
  async pathExists(path: string): Promise<boolean> {
    return fs.pathExists(path)
  }
}
