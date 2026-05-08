import type { ImportEditor } from '@engine/ast/import-editor'
import type { SourceFile } from 'ts-morph'

type EnsureNamedImportCall = {
  sourceFile: SourceFile
  name: string
  moduleSpecifier: string
}

export class FakeImportEditor implements ImportEditor {
  ensureNamedImportCalls: EnsureNamedImportCall[] = []

  readonly instance: ImportEditor = {
    ensureNamedImport: this.ensureNamedImport.bind(this),
    ensureSideEffectImport: this.ensureSideEffectImport.bind(this)
  }

  ensureNamedImport(sourceFile: SourceFile, name: string, moduleSpecifier: string): void {
    this.ensureNamedImportCalls.push({
      sourceFile,
      name,
      moduleSpecifier,
    })
  }

  ensureSideEffectImport(sourceFile: SourceFile, moduleSpecifier: string, position?: 'top' | 'bottom'): void {
    console.log(sourceFile)
    console.log(moduleSpecifier)
    console.log(position)
    throw new Error('Method not implemented.')
  }
}
