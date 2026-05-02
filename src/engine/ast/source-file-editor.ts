import type { SourceFile } from 'ts-morph'
import type { TsMorphProjectFactory } from './ts-morph-project-factory'

export class SourceFileEditor {
  constructor(private readonly projectFactory: TsMorphProjectFactory) {}

  async edit(
    filePath: string,
    callback: (sourceFile: SourceFile) => void | Promise<void>
  ): Promise<void> {
    const project = this.projectFactory.create()
    const sourceFile = project.addSourceFileAtPath(filePath)

    await callback(sourceFile)
    await sourceFile.save()
  }
}
