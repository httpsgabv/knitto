import type { GenerationOperation } from '@core/generation/operation'
import type {
  FeatureManifest,
  KitManifest,
  Manifest,
} from '@core/manifest/manifest'
import type { Template } from '@core/template/template'
import type { TemplateFile } from '@core/template/template-file'
import { normalizeSlashes } from '@shared/paths'
import { ManifestOperationBuilder } from './manifest-operation-builder'
import type { PlanInput } from './plan-input'

export class ManifestOperationsExpander {
  constructor(
    private readonly manifestOperationBuilder: ManifestOperationBuilder
  ) {}

  expand(input: {
    planInput: PlanInput
    kitManifest: KitManifest
    featureManifests: FeatureManifest[]
    kitFiles: TemplateFile[]
    featureFiles: TemplateFile[][]
  }): GenerationOperation[] {
    const { planInput } = input
    const kitOperations = this.expandManifestOperations({
      manifest: input.kitManifest,
      files: input.kitFiles,
      templateDir: planInput.kitTemplate.rootPath,
      targetDir: planInput.targetDir,
      origin: { type: 'kit', slug: planInput.kit.slug },
    })

    const featureOperations = planInput.features.flatMap((feature, index) => {
      const manifest = input.featureManifests[index]
      const template = planInput.featureTemplates[index]
      const files = input.featureFiles[index]

      if (manifest === undefined) {
        throw new Error('Feature manifests must align with selected features')
      }

      return this.expandManifestOperations({
        manifest,
        files: files ?? [],
        templateDir: this.getTemplateRoot(template),
        targetDir: planInput.targetDir,
        origin: { type: 'feature', slug: feature.slug },
      })
    })

    return [...kitOperations, ...featureOperations]
  }

  private expandManifestOperations(input: {
    manifest: Manifest
    files: TemplateFile[]
    templateDir: string
    targetDir: string
    origin: { type: 'kit' | 'feature'; slug: string }
  }): GenerationOperation[] {
    const explicitSources = new Set(
      input.manifest.operations
        .filter((operation) => 'source' in operation)
        .map((operation) => normalizeSlashes(operation.source))
    )

    return input.manifest.operations.flatMap((operation) =>
      this.manifestOperationBuilder.buildAll({
        operation,
        templateDir: input.templateDir,
        targetDir: input.targetDir,
        origin: input.origin,
        templateFiles: input.files,
        manifestName: input.manifest.name,
        explicitSources,
      })
    )
  }

  private getTemplateRoot(template: Template | undefined): string {
    return template?.rootPath ?? ''
  }
}
