import path from 'node:path'
import type { Kit } from '../../core/catalog/kit'
import type {
  FileOperation,
  OperationOrigin,
} from '../../core/generation/file-operation'
import type { TemplateFile } from '../../core/template/template-file'
import { createId } from '../../shared/ids'
import type { Feature } from '../../core/catalog/feature'

export class OperationBuilder {
  buildKitOperation(input: {
    kit: Kit
    files: TemplateFile[]
    targetDir: string
  }): FileOperation[] {
    const origin: OperationOrigin = { type: 'kit', slug: input.kit.slug }
    return input.files.map((file) =>
      this.buildOperation({
        file,
        origin,
        targetDir: input.targetDir,
        isFeature: false,
      })
    )
  }

  buildFeatureOperation(input: {
    feature: Feature
    files: TemplateFile[]
    targetDir: string
  }): FileOperation[] {
    const origin: OperationOrigin = {
      type: 'feature',
      slug: input.feature.slug,
    }
    return input.files.map((file) =>
      this.buildOperation({
        file,
        origin,
        targetDir: input.targetDir,
        isFeature: true,
      })
    )
  }

  private buildOperation(input: {
    file: TemplateFile
    origin: OperationOrigin
    targetDir: string
    isFeature: boolean
  }): FileOperation {
    const target = path.join(
      input.targetDir,
      input.file.relativePath.replace(/README\.knitto\.md$/, 'README.md')
    )

    if (!input.isFeature) {
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

    if (input.file.relativePath === 'package.json') {
      return {
        id: createId('merge-package-json'),
        type: 'merge-package-json',
        source: input.file.absolutePath,
        target,
        strategy: 'safe-merge',
        origin: input.origin,
        description: `Merge package.json from ${input.origin.slug}`,
      }
    }

    if (input.file.relativePath === '.env.example') {
      return {
        id: createId('append-env'),
        type: 'append-env',
        source: input.file.absolutePath,
        target,
        strategy: 'append-missing',
        origin: input.origin,
        description: `Append env entries from ${input.origin.slug}`,
      }
    }

    if (input.file.relativePath === 'README.knitto.md') {
      return {
        id: createId('append-readme'),
        type: 'append-readme',
        source: input.file.absolutePath,
        target,
        heading: `Feature: ${input.origin.slug}`,
        origin: input.origin,
        description: `Append README notes from ${input.origin.slug}`,
      }
    }

    return {
      id: createId('copy'),
      type: 'copy-file',
      source: input.file.absolutePath,
      target,
      renderVariables: true,
      overwrite: false,
      origin: input.origin,
      description: `Copy ${input.file.relativePath} from ${input.origin.slug}`,
    }
  }
}
