import type { FileSystem } from '@adapters/fs/file-system'

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

  async upsert(target: string, values: Record<string, string>) {
    const targetContent = (await this.fileSystem.pathExists(target))
      ? await this.fileSystem.readFile(target, 'utf8')
      : ''

    const lines = targetContent.split(/\r?\n/)
    const seenKeys = new Set<string>()
    const nextLines = lines.map((line) => {
      const key = this.extractKey(line)

      if (!key || !(key in values) || seenKeys.has(key)) {
        return line
      }

      seenKeys.add(key)

      return `${key}=${values[key]}`
    })

    const appendedLines = Object.entries(values)
      .filter(([key]) => !seenKeys.has(key))
      .map(([key, value]) => `${key}=${value}`)

    const trimmedTarget = nextLines.join('\n').trimEnd()
    const chunks = [trimmedTarget, appendedLines.join('\n')].filter(Boolean)

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
