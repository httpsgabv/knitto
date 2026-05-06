import type { OperationOrigin } from '@core/generation/file-operation'
import type { GenerationOperation } from '@core/generation/operation'
import type { ManifestOperation } from '@core/manifest/manifest-operation'
import type { TemplateFile } from '@core/template/template-file'
import { normalizeRelativePath } from '@shared/paths'
import type { ManifestOperationHandlerRegistry } from './manifest-operation-handler-registry'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'

export class ManifestOperationBuilder {
  constructor(
    private readonly handlers: ManifestOperationHandlerRegistry,
    private readonly pathResolver: ManifestOperationPathResolver =
      new ManifestOperationPathResolver()
  ) {}

  buildAll(input: {
    operation: ManifestOperation
    templateDir: string
    targetDir: string
    origin: OperationOrigin
    templateFiles?: TemplateFile[]
    manifestName?: string
    explicitSources?: Set<string>
  }): GenerationOperation[] {
    if (input.operation.type !== 'add-all') {
      return [this.build(input)]
    }

    const explicitSources = new Set(
      Array.from(input.explicitSources ?? []).map(normalizeRelativePath)
    )

    return (input.templateFiles ?? [])
      .filter(
        (file) => !explicitSources.has(normalizeRelativePath(file.relativePath))
      )
      .map((file) => {
        if (file.relativePath === 'package.json') {
          return this.build({
            ...input,
            operation: {
              type: 'merge-package-json',
              source: file.relativePath,
              target: 'package.json',
              strategy: 'safe-merge',
            },
          })
        }

        if (file.relativePath === '.env.example') {
          return this.build({
            ...input,
            operation: {
              type: 'append-env',
              source: file.relativePath,
              target: '.env.example',
              strategy: 'append-missing',
            },
          })
        }

        if (file.relativePath === 'README.knitto.md') {
          return this.build({
            ...input,
            operation: {
              type: 'append-readme',
              source: file.relativePath,
              target: 'README.md',
              heading: input.manifestName ?? input.origin.slug,
            },
          })
        }

        return this.build({
          ...input,
          operation: {
            type: 'copy-file',
            source: file.relativePath,
            target: file.relativePath,
            overwrite: false,
            renderVariables: true,
          },
        })
      })
  }

  build(input: {
    operation: ManifestOperation
    templateDir: string
    targetDir: string
    origin: OperationOrigin
  }): GenerationOperation {
    if (input.operation.type === 'add-all') {
      throw new Error('add-all must be expanded before building operations')
    }

    const description = `Apply ${input.operation.type} from ${input.origin.slug}`
    const handler = this.handlers.get(input.operation.type)

    if (!handler) {
      throw new Error(
        `No handler registered for manifest operation type: ${input.operation.type}`
      )
    }

    return handler.build({
      operation: input.operation,
      templateDir: input.templateDir,
      targetDir: input.targetDir,
      origin: input.origin,
      description,
      resolveSource: (source: string) =>
        this.pathResolver.resolveSource(input.templateDir, source),
      resolveTarget: (target: string) =>
        this.pathResolver.resolveTarget(input.targetDir, target),
    })
  }
}
