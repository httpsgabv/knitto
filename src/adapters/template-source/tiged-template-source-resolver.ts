import type { TemplateSource } from '@core/catalog/template-source'
import type { TemplateSourceResolver } from './template-source-resolver'
import tiged from 'tiged'

export class TigedTemplateSourceResolver implements TemplateSourceResolver {
  async resolve(
    targetPath: string,
    source: Extract<TemplateSource, { type: 'github' }>
  ): Promise<void> {
    const templateGithubPath = `${source.repo}${source.path}${source.name}`

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const emitter = tiged(templateGithubPath, {
      disableCache: true,
      force: true,
      verbose: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await emitter.clone(targetPath)
  }
}
