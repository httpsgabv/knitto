import { describe, expect, it } from 'vitest'
import { Project, QuoteKind } from 'ts-morph'
import type { ImportDeclaration, SourceFile } from 'ts-morph'
import { ImportEditor } from './import-editor'

describe('ImportEditor', () => {
  it('adds a named import', () => {
    const sourceFile = createSourceFile('const value = 1\n')

    new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')

    expect(sourceFile.getImportDeclarations()).toHaveLength(1)
    expect(getImportDeclaration(sourceFile, '@nestjs/config').getText()).toBe(
      "import { ConfigModule } from '@nestjs/config';"
    )
    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('does not duplicate a named import', () => {
    const sourceFile = createSourceFile(
      "import { ConfigModule } from '@nestjs/config'\n\nconst value = 1\n"
    )

    const importEditor = new ImportEditor()

    importEditor.ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')
    importEditor.ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')

    expect(sourceFile.getImportDeclarations()).toHaveLength(1)
    expect(getNamedImports(sourceFile, '@nestjs/config')).toEqual([
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('adds a named import to an existing import declaration', () => {
    const sourceFile = createSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({})\nexport class AppModule {}\n"
    )

    new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/common')

    expect(sourceFile.getImportDeclarations()).toHaveLength(1)
    expect(getNamedImports(sourceFile, '@nestjs/common')).toEqual([
      { name: 'Module', alias: undefined },
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('preserves aliased named imports while adding a direct local identifier', () => {
    const sourceFile = createSourceFile(
      "import { ConfigModule as NestConfigModule } from '@nestjs/common'\n\nconst value = NestConfigModule\n"
    )

    new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/common')

    expect(sourceFile.getImportDeclarations()).toHaveLength(1)
    expect(getNamedImports(sourceFile, '@nestjs/common')).toEqual([
      { name: 'ConfigModule', alias: 'NestConfigModule' },
      { name: 'ConfigModule', alias: undefined },
    ])
  })

  it('does not duplicate a named import when an equivalent alias keeps the same local name', () => {
    const sourceFile = createSourceFile(
      "import { ConfigModule as ConfigModule } from '@nestjs/common'\n\nconst value = ConfigModule\n"
    )

    new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/common')

    expect(sourceFile.getImportDeclarations()).toHaveLength(1)
    expect(getNamedImports(sourceFile, '@nestjs/common')).toEqual([
      { name: 'ConfigModule', alias: 'ConfigModule' },
    ])
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

function getNamedImports(sourceFile: SourceFile, moduleSpecifier: string) {
  return getImportDeclaration(sourceFile, moduleSpecifier)
    .getNamedImports()
    .map((namedImport) => ({
      name: namedImport.getName(),
      alias: namedImport.getAliasNode()?.getText(),
    }))
}

function getImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string): ImportDeclaration {
  const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier)

  expect(importDeclaration).toBeDefined()

  return importDeclaration!
}
