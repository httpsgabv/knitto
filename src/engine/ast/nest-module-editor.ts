import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import { Node, SyntaxKind, type ObjectLiteralExpression, type SourceFile } from 'ts-morph'
import { ImportEditor } from './import-editor'

type EnsureModuleImportInput = {
  sourceFile: SourceFile
  namedImport: {
    name: string
    from: string
  }
  moduleName: string
}

export class NestModuleEditor {
  constructor(private readonly importEditor = new ImportEditor()) {}

  ensureModuleImport({ sourceFile, namedImport, moduleName }: EnsureModuleImportInput): void {
    this.importEditor.ensureNamedImport(sourceFile, namedImport.name, namedImport.from)

    const moduleDecorator = sourceFile
      .getClasses()
      .flatMap((classDeclaration) => classDeclaration.getDecorators())
      .find((decorator) => decorator.getName() === 'Module')

    if (!moduleDecorator) {
      throw new KnittoError(
        'Could not find a class decorated with @Module in the source file.',
        Errors.AST_MODULE_DECORATOR_NOT_FOUND
      )
    }

    const moduleMetadata = moduleDecorator
      .getArguments()[0]
      ?.asKind(SyntaxKind.ObjectLiteralExpression)

    if (!moduleMetadata) {
      throw new KnittoError(
        'Could not find a class decorated with @Module in the source file.',
        Errors.AST_MODULE_DECORATOR_NOT_FOUND
      )
    }

    const importsArray = this.getOrCreateImportsArray(moduleMetadata)
    const existingImports = importsArray.getElements().map((element) => element.getText())

    if (!existingImports.includes(moduleName)) {
      importsArray.addElement(moduleName)
    }
  }

  private getOrCreateImportsArray(moduleMetadata: ObjectLiteralExpression) {
    const importsProperty = moduleMetadata.getProperty('imports')

    if (importsProperty && !Node.isPropertyAssignment(importsProperty)) {
      throw new KnittoError(
        'Expected @Module imports metadata to use a direct array property assignment.',
        Errors.AST_MODULE_IMPORTS_UNSUPPORTED_SHAPE
      )
    }

    if (importsProperty) {
      const initializer = importsProperty.getInitializer()
      const importsArray = initializer?.asKind(SyntaxKind.ArrayLiteralExpression)

      if (!importsArray) {
        throw new KnittoError(
          'Expected @Module imports metadata to be an array literal.',
          Errors.AST_MODULE_IMPORTS_NOT_ARRAY
        )
      }

      return importsArray
    }

    return moduleMetadata
      .addPropertyAssignment({
        name: 'imports',
        initializer: '[]',
      })
      .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
  }
}
