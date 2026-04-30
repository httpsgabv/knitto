import type { TemplateSourceResolver } from '@adapters/template-source/template-source-resolver'
import type { TemplateSource } from '@core/catalog/template-source'

export class FakeTemplateSourceResolver implements TemplateSourceResolver {
  private calls: Array<{ targetPath: string; source: TemplateSource }> = []

  async resolve(targetPath: string, source: TemplateSource): Promise<void> {
    this.calls.push({ targetPath, source })
    await Promise.resolve()
  }

  getCalls(): Array<{ targetPath: string; source: TemplateSource }> {
    return [...this.calls]
  }

  clearCalls(): void {
    this.calls = []
  }
}
