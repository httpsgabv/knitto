import path from 'node:path'
import type { FileSystem } from '../../adapters/fs/file-system'
import type { Template } from '../../core/template/template'
import type { TemplateFile } from '../../core/template/template-file'

export class TemplateScanner {
  constructor(private readonly fileSystem: FileSystem) {}

  async scan(template: Template): Promise<TemplateFile[]> {
    const templateDir = path.join(template.rootPath)
    const files = await this.fileSystem.listFiles(templateDir)

    return files.map((relativePath) => ({
      absolutePath: path.join(relativePath),
      relativePath,
    }))
  }
}
