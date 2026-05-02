import type { Manifest } from '@core/manifest/manifest'
import type { TemplateFile } from '@core/template/template-file'
import type { TemplateFileMatcher } from '../../adapters/template-file-matcher/template-file-matcher'

export class ManifestFileFilter {
  constructor(private readonly templateFileMatcher: TemplateFileMatcher) {}

  filter(files: TemplateFile[], manifest: Manifest | null): TemplateFile[] {
    const filteredFiles = files.filter(
      (file) => file.relativePath !== 'knitto.json'
    )

    if (manifest?.files === undefined) {
      return filteredFiles
    }

    const { include, exclude } = manifest.files
    const matchedFiles = this.templateFileMatcher.match({
      files: filteredFiles,
      include,
      exclude,
    })

    return filteredFiles.filter((file) => matchedFiles.has(file.relativePath))
  }
}
