import type { FileSystem } from '@adapters/fs/file-system'

export class LineAppender {
  constructor(private readonly fileSystem: FileSystem) {}

  async appendMissing(target: string, lines: string[]) {
    const targetContent = (await this.fileSystem.pathExists(target))
      ? await this.fileSystem.readFile(target, 'utf8')
      : ''

    const existingLines = new Set(targetContent.split(/\r?\n/))
    const missingLines = lines.filter((line) => !existingLines.has(line))

    if (missingLines.length === 0 && targetContent) {
      return
    }

    const trimmedTarget = targetContent.trimEnd()
    const chunks = [trimmedTarget, missingLines.join('\n')].filter(Boolean)

    await this.fileSystem.writeFile(target, `${chunks.join('\n\n')}\n`)
  }
}
