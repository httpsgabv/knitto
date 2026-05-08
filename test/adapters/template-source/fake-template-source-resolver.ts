import type { TemplateSourceResolver } from '@adapters/template-source/template-source-resolver'

export class FakeTemplateSourceResolver implements TemplateSourceResolver {
  private calls: Array<{ targetPath: string; repo: string }> = []

  async resolve(targetPath: string, repo: string): Promise<void> {
    this.calls.push({ targetPath, repo })
    await Promise.resolve()
  }

  getCalls(): Array<{ targetPath: string; repo: string }> {
    return [...this.calls]
  }

  clearCalls(): void {
    this.calls = []
  }
}
