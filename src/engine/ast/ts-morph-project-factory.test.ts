import { describe, expect, it } from 'vitest'
import { TsMorphProjectFactory } from './ts-morph-project-factory'

describe('TsMorphProjectFactory', () => {
  it('creates source files that emit single-quoted imports when manipulated', () => {
    const project = new TsMorphProjectFactory().create()
    const sourceFile = project.createSourceFile('app.module.ts', 'const value = 1\n')

    const importDeclaration = sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/common',
      namedImports: ['Module'],
    })

    expect(importDeclaration.getText()).toBe("import { Module } from '@nestjs/common';")
  })

  it('starts with no preloaded tsconfig-managed source files', () => {
    const project = new TsMorphProjectFactory().create()

    expect(project.getSourceFiles()).toHaveLength(0)
  })
})
