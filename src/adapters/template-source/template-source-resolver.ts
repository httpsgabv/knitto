import type { TemplateSource } from '@core/catalog/template-source'

export interface TemplateSourceResolver {
  resolve(targetPath: string, source: TemplateSource): Promise<void>
}
