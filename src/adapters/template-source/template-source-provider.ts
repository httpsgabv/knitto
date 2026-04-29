import type { TemplateSource } from '../../core/catalog/template-source'
import type { Template } from '../../core/template/template'

export interface TemplateSourceProvider {
  fetch(source: TemplateSource): Promise<Template>
}
