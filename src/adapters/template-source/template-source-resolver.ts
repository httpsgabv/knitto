export interface TemplateSourceResolver {
  resolve(targetPath: string, repo: string): Promise<void>
}
