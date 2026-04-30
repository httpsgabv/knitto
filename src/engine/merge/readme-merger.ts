import type { FileSystem } from '@adapters/fs/file-system'

export class ReadmeMerger {
  constructor(private readonly fileSystem: FileSystem) {}

  async merge(source: string, target: string, heading: string) {
    const sourceContent = await this.fileSystem.readFile(source, 'utf8')
    const targetContent = (await this.fileSystem.pathExists(target))
      ? await this.fileSystem.readFile(target, 'utf8')
      : ''
    const section = `## ${heading}\n\n${sourceContent.trim()}\n`
    const nextContent = `${targetContent.trimEnd()}\n\n${section}`.trimStart()
    await this.fileSystem.writeFile(target, `${nextContent}\n`)
  }
}
