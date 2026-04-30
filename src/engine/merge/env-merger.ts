import type { FileSystem } from '../../adapters/fs/file-system'

export class EnvMerger {
  constructor(private readonly fileSystem: FileSystem) {}

  async merge(source: string, target: string) {
    const sourceContent = await this.fileSystem.readFile(source, 'utf8')
    const targetContent = (await this.fileSystem.pathExists(target))
      ? await this.fileSystem.readFile(target, 'utf8')
      : ''

    const existingKeys = new Set(this.extractKeys(targetContent))
    const appendedLines: string[] = []

    for (const line of sourceContent.split(/\r?\n/)) {
      const key = this.extractKey(line)
      if (!key) {
        continue
      }

      if (!existingKeys.has(key)) {
        appendedLines.push(line)
        existingKeys.add(key)
      }
    }

    if (appendedLines.length === 0) {
      return
    }

    const trimmedTarged = targetContent.trimEnd()
    const chunks = [trimmedTarged, appendedLines.join('\n')].filter(Boolean)
    await this.fileSystem.writeFile(target, `${chunks.join('\n\n')}\n`)
  }

  private extractKeys(content: string) {
    return content
      .split(/\r?\n/)
      .map((line) => this.extractKey(line))
      .filter((key): key is string => Boolean(key))
  }

  private extractKey(line: string) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return null
    }

    return trimmed.slice(0, trimmed.indexOf('=')).trim() || null
  }
}
