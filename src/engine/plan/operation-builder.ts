import path from 'node:path'
import type { Kit } from '../../core/catalog/kit'
import type {
  FileOperation,
  OperationOrigin,
} from '../../core/generation/file-operation'
import type { TemplateFile } from '../../core/template/template-file'
import { createId } from '../../shared/ids'

export class OperationBuilder {
  buildKitOperation(input: {
    kit: Kit
    files: TemplateFile[]
    targetDir: string
  }): FileOperation[] {
    const origin: OperationOrigin = { type: 'kit', slug: input.kit.slug }
    return input.files.map((file) =>
      this.buildOperation({ file, origin, targetDir: input.targetDir })
    )
  }

  private buildOperation(input: {
    file: TemplateFile
    origin: OperationOrigin
    targetDir: string
  }): FileOperation {
    const target = path.join(
      input.targetDir,
      input.file.relativePath.replace(/README\.knitto\.md$/, 'README.md')
    )

    return {
      id: createId('copy'),
      type: 'copy-file',
      source: input.file.absolutePath,
      target,
      renderVariables: true,
      overwrite: true,
      origin: input.origin,
      description: `Copy ${input.file.relativePath} from ${input.origin.slug}`,
    }
  }
}
