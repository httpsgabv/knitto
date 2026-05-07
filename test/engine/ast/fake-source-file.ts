import type { SourceFile } from 'ts-morph'

type SourceFileSaveShape = Pick<SourceFile, 'save'>

export class FakeSourceFile {
  saveCalls = 0
  events: string[] = []

  readonly instance: SourceFileSaveShape = {
    save: this.save.bind(this),
  }

  async save(): Promise<void> {
    this.saveCalls += 1
    this.events.push('save')
  }
}
