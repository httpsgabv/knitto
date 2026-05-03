import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NestModuleEditor } from './nest-module-editor'
import { SourceFileEditor } from './source-file-editor'
import { TsMorphProjectFactory } from './ts-morph-project-factory'

describe('NestModuleEditor', () => {
  it('adds a module to an empty imports array', async () => {
    const filePath = await writeTempSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({ imports: [] })\nexport class AppModule {}\n"
    )

    await editSourceFile(filePath, (sourceFile) => {
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain("import { ConfigModule } from '@nestjs/config'")
    expect(content).toContain('@Module({ imports: [ConfigModule] })')
  })

  it('creates an imports array if missing', async () => {
    const filePath = await writeTempSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({})\nexport class AppModule {}\n"
    )

    await editSourceFile(filePath, (sourceFile) => {
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(/@Module\(\{[\s\S]*imports: \[ConfigModule\][\s\S]*\}\)/)
  })

  it('does not duplicate a module import', async () => {
    const filePath = await writeTempSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        "import { ConfigModule } from '@nestjs/config'",
        '',
        '@Module({ imports: [ConfigModule] })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    await editSourceFile(filePath, (sourceFile) => {
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
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/ConfigModule/g)).toHaveLength(2)
  })

  it('adds a direct in-scope ConfigModule import when only an aliased import exists', async () => {
    const filePath = await writeTempSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        "import { ConfigModule as NestConfigModule } from '@nestjs/config'",
        '',
        '@Module({ imports: [] })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    await editSourceFile(filePath, (sourceFile) => {
      new NestModuleEditor().ensureModuleImport({
        sourceFile,
        namedImport: {
          name: 'ConfigModule',
          from: '@nestjs/config',
        },
        moduleName: 'ConfigModule',
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain(
      "import { ConfigModule as NestConfigModule, ConfigModule } from '@nestjs/config'"
    )
    expect(content).toContain('@Module({ imports: [ConfigModule] })')
  })

  it('throws a readable error when @Module is missing', async () => {
    const filePath = await writeTempSourceFile('export class AppModule {}\n')

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestModuleEditor().ensureModuleImport({
          sourceFile,
          namedImport: {
            name: 'ConfigModule',
            from: '@nestjs/config',
          },
          moduleName: 'ConfigModule',
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Could not find a class decorated with @Module in the source file.',
    })
  })

  it('throws a readable error when @Module metadata is missing', async () => {
    const filePath = await writeTempSourceFile(
      ["import { Module } from '@nestjs/common'", '', '@Module()', 'export class AppModule {}', ''].join(
        '\n'
      )
    )

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestModuleEditor().ensureModuleImport({
          sourceFile,
          namedImport: {
            name: 'ConfigModule',
            from: '@nestjs/config',
          },
          moduleName: 'ConfigModule',
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Could not find a class decorated with @Module in the source file.',
    })
  })

  it('throws a readable error when imports metadata is not an array', async () => {
    const filePath = await writeTempSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        '',
        '@Module({ imports: ConfigModule })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestModuleEditor().ensureModuleImport({
          sourceFile,
          namedImport: {
            name: 'ConfigModule',
            from: '@nestjs/config',
          },
          moduleName: 'ConfigModule',
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected @Module imports metadata to be an array literal.',
    })
  })

  it('throws a readable error when an existing imports property has an unsupported shape', async () => {
    const filePath = await writeTempSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        'const imports = []',
        '',
        '@Module({ imports })',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestModuleEditor().ensureModuleImport({
          sourceFile,
          namedImport: {
            name: 'ConfigModule',
            from: '@nestjs/config',
          },
          moduleName: 'ConfigModule',
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected @Module imports metadata to use a direct array property assignment.',
    })
  })
})

const projectFactory = new TsMorphProjectFactory()
const sourceFileEditor = new SourceFileEditor(projectFactory)

async function editSourceFile(
  filePath: string,
  edit: Parameters<SourceFileEditor['edit']>[1]
): Promise<void> {
  await sourceFileEditor.edit(filePath, edit)
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'knitto-ast-nest-module-editor-'))
  const filePath = join(directory, 'app.module.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
