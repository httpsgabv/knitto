import type { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { FakeProject } from '@test/engine/ast/fake-project'
import { FakeSourceFile } from '@test/engine/ast/fake-source-file'

export class FakeProjectFactory {
  createCalls = 0
  readonly sourceFile = new FakeSourceFile()
  readonly project = new FakeProject(this.sourceFile)

  create(): ReturnType<TsMorphProjectFactory['create']> {
    this.createCalls += 1

    return this.project.instance as ReturnType<TsMorphProjectFactory['create']>
  }
}
