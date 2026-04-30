const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.gz',
])

export class VariableRenderer {
  render(filePath: string, content: string, variables: Record<string, string>) {
    if (this.isBinaryFile(filePath)) {
      return content
    }

    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replaceAll(`{{${key}}}`, value)
    }, content)
  }

  private isBinaryFile(filePath: string) {
    const extension = filePath.slice(filePath.lastIndexOf('.'))
    return BINARY_EXTENSIONS.has(extension.toLowerCase())
  }
}
