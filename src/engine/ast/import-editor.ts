import type { SourceFile } from 'ts-morph'

export class ImportEditor {
  ensureNamedImport(sourceFile: SourceFile, name: string, moduleSpecifier: string): void {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier)

    if (!importDeclaration) {
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [name],
      })
      return
    }

    const hasDirectLocalIdentifier = importDeclaration.getNamedImports().some((namedImport) => {
      const alias = namedImport.getAliasNode()?.getText()

      return namedImport.getName() === name && (alias === undefined || alias === name)
    })

    if (hasDirectLocalIdentifier) {
      return
    }

    importDeclaration.addNamedImport({ name })
  }
}
