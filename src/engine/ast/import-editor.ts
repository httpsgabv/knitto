import type { SourceFile } from 'ts-morph'

export class ImportEditor {
  ensureNamedImport(
    sourceFile: SourceFile,
    name: string,
    moduleSpecifier: string
  ): void {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier)

    if (!importDeclaration) {
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [name],
      })
      return
    }

    const hasDirectLocalIdentifier = importDeclaration
      .getNamedImports()
      .some((namedImport) => {
        const alias = namedImport.getAliasNode()?.getText()

        return (
          namedImport.getName() === name &&
          (alias === undefined || alias === name)
        )
      })

    if (hasDirectLocalIdentifier) {
      return
    }

    importDeclaration.addNamedImport({ name })
  }

  ensureSideEffectImport(
    sourceFile: SourceFile,
    moduleSpecifier: string,
    position: 'top' | 'bottom' = 'top'
  ): void {
    const alreadyExists = sourceFile
      .getImportDeclarations()
      .some((importDeclaration) => {
        return importDeclaration.getModuleSpecifierValue() === moduleSpecifier
      })

    if (alreadyExists) {
      return
    }

    if (position === 'top') {
      sourceFile.insertImportDeclaration(0, {
        moduleSpecifier,
      })

      return
    }

    sourceFile.addImportDeclaration({
      moduleSpecifier,
    })
  }
}
