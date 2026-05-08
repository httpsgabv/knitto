import type { TemplateSourceResolver } from './template-source-resolver'
import tiged from 'tiged'

export class TigedTemplateSourceResolver implements TemplateSourceResolver {
  async resolve(targetPath: string, repo: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const emitter = tiged(repo, {
      disableCache: true,
      force: true,
      verbose: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await emitter.clone(targetPath)
  }
}
