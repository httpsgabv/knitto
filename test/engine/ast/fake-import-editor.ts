import type { ImportEditor } from '@engine/ast/import-editor'
import type { SourceFile } from 'ts-morph'

type ImportEditorShape = Pick<ImportEditor, 'ensureNamedImport'>

type EnsureNamedImportCall = {
  sourceFile: SourceFile
  name: string
  moduleSpecifier: string
}

export class FakeImportEditor {
  ensureNamedImportCalls: EnsureNamedImportCall[] = []

  readonly instance: ImportEditorShape = {
    ensureNamedImport: this.ensureNamedImport.bind(this),
  }

  ensureNamedImport(sourceFile: SourceFile, name: string, moduleSpecifier: string): void {
    this.ensureNamedImportCalls.push({
      sourceFile,
      name,
      moduleSpecifier,
    })
  }
}
