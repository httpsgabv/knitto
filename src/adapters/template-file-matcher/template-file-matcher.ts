import type { TemplateFile } from '@core/template/template-file'

export interface TemplateFileMatcher {
  match(input: {
    files: TemplateFile[]
    include: string[]
    exclude: string[]
  }): Set<string>
}
