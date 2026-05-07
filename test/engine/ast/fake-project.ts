import type { Project } from 'ts-morph'
import { FakeSourceFile } from '@test/engine/ast/fake-source-file'

type ProjectAddSourceFileShape = Pick<Project, 'addSourceFileAtPath'>

export class FakeProject {
  addSourceFileAtPathCalls: string[] = []

  readonly instance: ProjectAddSourceFileShape = {
    addSourceFileAtPath: this.addSourceFileAtPath.bind(this),
  }

  constructor(private readonly sourceFile: FakeSourceFile) {}

  addSourceFileAtPath(filePath: string): ReturnType<Project['addSourceFileAtPath']> {
    this.addSourceFileAtPathCalls.push(filePath)

    return this.sourceFile.instance as ReturnType<Project['addSourceFileAtPath']>
  }
}
