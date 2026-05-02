import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { Manifest } from '@core/manifest/manifest'
import type { OperationOrigin } from '@core/generation/file-operation'
import { ManifestReader } from './manifest-reader'
import { ManifestValidator } from './manifest-validator'

export class ManifestLoader {
  constructor(
    private readonly reader: ManifestReader,
    private readonly validator: ManifestValidator
  ) {}

  async load(
    templateRoot: string,
    expectedOrigin: OperationOrigin
  ): Promise<Manifest | null> {
    const manifestData = await this.reader.read(templateRoot)

    if (manifestData === null) {
      return null
    }

    const manifest = this.validator.validate(manifestData)

    if (manifest.type !== expectedOrigin.type) {
      throw new KnittoError(
        `Template manifest type mismatch: expected ${expectedOrigin.type}, received ${manifest.type}`,
        Errors.INVALID_TEMPLATE_MANIFEST
      )
    }

    if (manifest.slug !== expectedOrigin.slug) {
      throw new KnittoError(
        `Template manifest slug mismatch: expected ${expectedOrigin.slug}, received ${manifest.slug}`,
        Errors.INVALID_TEMPLATE_MANIFEST
      )
    }

    return manifest
  }

  async loadMany(
    items: Array<{
      templateRoot: string
      expectedOrigin: OperationOrigin
    }>
  ): Promise<Array<Manifest | null>> {
    for (const item of items) {
      if (item.templateRoot.length === 0) {
        throw new Error('Template roots must be provided for loadMany')
      }
    }

    return Promise.all(
      items.map((item) => this.load(item.templateRoot, item.expectedOrigin))
    )
  }
}
