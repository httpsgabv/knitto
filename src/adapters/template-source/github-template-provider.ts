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
    const [template] = await this.fetchMany([source])
    return template!
  }

  async fetchMany(sources: TemplateSource[]): Promise<Template[]> {
    const githubSources = sources.map((source) => {
      this.assertValidRepo(source.repo)
      return source
    })

    const repoDirs = await this.downloadUniqueRepos(githubSources)

    return Promise.all(
      githubSources.map((source) => this.materializeTemplate(source, repoDirs))
    )
  }

  private async downloadUniqueRepos(
    sources: Array<Extract<TemplateSource, { type: 'github' }>>
  ): Promise<Map<string, string>> {
    const uniqueRepos = [...new Set(sources.map((s) => s.repo))]

    const entries = await Promise.all(
      uniqueRepos.map(async (repo) => {
        const [, repoName] = repo.split('/')
        const repoDir = path.join(
          os.tmpdir(),
          `knitto-repo-${repoName}-${Date.now()}-${randomSuffix()}`
        )
        await this.fileSystem.ensureDir(repoDir)
        await this.templateSourceResolver.resolve(repoDir, repo)
        return [repo, repoDir] as const
      })
    )

    return new Map(entries)
  }

  private async materializeTemplate(
    source: Extract<TemplateSource, { type: 'github' }>,
    repoDirs: Map<string, string>
  ): Promise<Template> {
    const repoDir = repoDirs.get(source.repo)!
    const [, repoName] = source.repo.split('/')

    const tempRoot = path.join(
      os.tmpdir(),
      `knitto-${repoName}-${source.name}-${Date.now()}-${randomSuffix()}`
    )
    const templatePath = path.join(tempRoot, source.name)
    const subdirInRepo = path.join(repoDir, source.path, source.name)

    await this.fileSystem.ensureDir(tempRoot)
    await this.fileSystem.copyDir(subdirInRepo, templatePath)

    if (!(await this.fileSystem.pathExists(templatePath))) {
      throw new KnittoError(
        `Failed to download template from ${source.path}`,
        Errors.TEMPLATE_DOWNLOAD_FAILED
      )
    }

    return {
      rootPath: templatePath,
    }
  }

  private assertValidRepo(repo: string): void {
    const [owner, name] = repo.split('/')
    if (!owner || !name) {
      throw new KnittoError(
        `Invalid GitHub repo reference: ${repo}`,
        Errors.INVALID_GITHUB_SOURCE
      )
    }
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10)
}
