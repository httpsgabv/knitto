import path from 'node:path'
import type { FileSystem } from '@adapters/fs/file-system'
import type { Template } from '@core/template/template'
import type { TemplateFile } from '@core/template/template-file'
import { normalizeSystemPath } from '@shared/paths'

export class TemplateScanner {
  constructor(private readonly fileSystem: FileSystem) {}

  async scan(template: Template): Promise<TemplateFile[]> {
    const templateDir = normalizeSystemPath(template.rootPath)
    const files = await this.fileSystem.listFiles(templateDir)

    return files.map((relativePath) => ({
      absolutePath: normalizeSystemPath(path.join(template.rootPath, relativePath)),
      relativePath,
    }))
  }
}
