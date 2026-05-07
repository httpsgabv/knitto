import { describe, expect, it } from 'vitest'
import { Project, QuoteKind, SyntaxKind, type SourceFile } from 'ts-morph'
import { NestModuleEditor } from './nest-module-editor'
import { FakeImportEditor } from '@test/engine/ast/fake-import-editor'

describe('NestModuleEditor', () => {
  it('adds a module to an empty imports array', () => {
    const sourceFile = createSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({ imports: [] })\nexport class AppModule {}\n"
    )

    new NestModuleEditor().ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })

    expect(getModuleImports(sourceFile)).toEqual(['ConfigModule'])
    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('creates an imports array if missing', () => {
    const sourceFile = createSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({})\nexport class AppModule {}\n"
    )

    new NestModuleEditor().ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })

    expect(getModuleImports(sourceFile)).toEqual(['ConfigModule'])
  })

  it('does not duplicate a module import', () => {
    const sourceFile = createSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        "import { ConfigModule } from '@nestjs/config'",
        '',
        '@Module({ imports: [ConfigModule] })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    const editor = new NestModuleEditor()

    editor.ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })
    editor.ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })

    expect(getModuleImports(sourceFile)).toEqual(['ConfigModule'])
    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('keeps an aliased import while adding the direct module name', () => {
    const sourceFile = createSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        "import { ConfigModule as NestConfigModule } from '@nestjs/config'",
        '',
        '@Module({ imports: [] })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    new NestModuleEditor().ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })

    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([
      { name: 'ConfigModule', alias: 'NestConfigModule' },
      { name: 'ConfigModule', alias: undefined },
    ])
    expect(getModuleImports(sourceFile)).toEqual(['ConfigModule'])
  })

  it('delegates named import edits to the collaborator', () => {
    const sourceFile = createSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({ imports: [] })\nexport class AppModule {}\n"
    )
    const importEditor = new FakeImportEditor()

    new NestModuleEditor(importEditor.instance).ensureModuleImport({
      sourceFile,
      namedImport: {
        name: 'ConfigModule',
        from: '@nestjs/config',
      },
      moduleName: 'ConfigModule',
    })

    expect(importEditor.ensureNamedImportCalls).toEqual([
      {
        sourceFile,
        name: 'ConfigModule',
        moduleSpecifier: '@nestjs/config',
      },
    ])
    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([])
    expect(getModuleImports(sourceFile)).toEqual(['ConfigModule'])
  })

  it('throws a readable error when @Module is missing', () => {
    const sourceFile = createSourceFile('export class AppModule {}\n')

    expectKnittoError(
      () =>
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      }),
      'Could not find a class decorated with @Module in the source file.'
    )
  })

  it('throws a readable error when @Module metadata is missing', () => {
    const sourceFile = createSourceFile(
      ["import { Module } from '@nestjs/common'", '', '@Module()', 'export class AppModule {}', ''].join(
        '\n'
      )
    )

    expectKnittoError(
      () =>
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      }),
      'Could not find a class decorated with @Module in the source file.'
    )
  })

  it('throws a readable error when imports metadata is not an array', () => {
    const sourceFile = createSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        '',
        '@Module({ imports: ConfigModule })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    expectKnittoError(
      () =>
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      }),
      'Expected @Module imports metadata to be an array literal.'
    )
  })

  it('throws a readable error when an existing imports property has an unsupported shape', () => {
    const sourceFile = createSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        'const imports = []',
        '',
        '@Module({ imports })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    expectKnittoError(
      () =>
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      }),
      'Expected @Module imports metadata to use a direct array property assignment.'
    )
  })
})

function createSourceFile(content: string): SourceFile {
  return new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  }).createSourceFile('app.module.ts', content)
}

function getModuleImports(sourceFile: SourceFile): string[] {
  return getModuleImportsArray(sourceFile).getElements().map((element) => element.getText())
}

function getModuleImportsArray(sourceFile: SourceFile) {
  const moduleDecorator = sourceFile
    .getClasses()
    .flatMap((classDeclaration) => classDeclaration.getDecorators())
    .find((decorator) => decorator.getName() === 'Module')

  expect(moduleDecorator).toBeDefined()

  const moduleMetadataArgument = moduleDecorator!.getArguments()[0]

  expect(moduleMetadataArgument).toBeDefined()

  const moduleMetadata = moduleMetadataArgument!.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  const importsProperty = moduleMetadata.getPropertyOrThrow('imports')
    .asKindOrThrow(SyntaxKind.PropertyAssignment)

  return importsProperty.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

function getNamedImports(sourceFile: SourceFile, moduleSpecifier: string) {
  const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier)

  if (!importDeclaration) {
    return []
  }

  return importDeclaration.getNamedImports().map((namedImport) => ({
    name: namedImport.getName(),
    alias: namedImport.getAliasNode()?.getText(),
  }))
}

function expectKnittoError(run: () => void, message: string) {
  try {
    run()
  } catch (error) {
    expect(error).toMatchObject({
      name: 'KnittoError',
      message,
    })
    return
  }

  throw new Error(`Expected KnittoError: ${message}`)
}
