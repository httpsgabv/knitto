import os from 'node:os'
import path from 'node:path'
import type { TemplateSource } from '@core/catalog/template-source'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { Template } from '@core/template/template'
import type { FileSystem } from '@adapters/fs/file-system'
import type { TemplateSourceProvider } from './template-source-provider'
import type { TemplateSourceResolver } from './template-source-resolver'

export class GithubTemplateProvider implements TemplateSourceProvider {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly templateSourceResolver: TemplateSourceResolver
  ) {}

  async fetch(
    source: Extract<TemplateSource, { type: 'github' }>
  ): Promise<Template> {
    const [owner, repo] = source.repo.split('/')
    if (!owner || !repo) {
      throw new KnittoError(
        `Invalid GitHub repo reference: ${source.repo}`,
        Errors.INVALID_GITHUB_SOURCE
      )
    }

    const tempRoot = path.join(
      os.tmpdir(),
      `knitto-${repo}-${source.name}-${Date.now()}`
    )
    const templatePath = path.join(tempRoot, source.name)

    await this.fileSystem.ensureDir(tempRoot)

    await this.templateSourceResolver.resolve(templatePath, source)

    const succesfullyCloned = await this.fileSystem.pathExists(templatePath)

    if (!succesfullyCloned) {
      throw new KnittoError(
        `Failed to download template from ${source.path}`,
        Errors.TEMPLATE_DOWNLOAD_FAILED
      )
    }

    return {
      rootPath: templatePath,
    }
  }

  async fetchMany(sources: TemplateSource[]): Promise<Template[]> {
    return Promise.all(sources.map((source) => this.fetch(source)))
  }
}
