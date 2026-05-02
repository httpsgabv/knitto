import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ImportEditor } from './import-editor'
import { SourceFileEditor } from './source-file-editor'
import { TsMorphProjectFactory } from './ts-morph-project-factory'

describe('ImportEditor', () => {
  it('adds a named import', async () => {
    const filePath = await writeTempSourceFile('const value = 1\n')

    await editSourceFile(filePath, (sourceFile) => {
      new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')
    })

    await expect(readFile(filePath, 'utf8')).resolves.toContain(
      "import { ConfigModule } from '@nestjs/config'"
    )
  })

  it('does not duplicate a named import', async () => {
    const filePath = await writeTempSourceFile(
      "import { ConfigModule } from '@nestjs/config'\n\nconst value = 1\n"
    )

    await editSourceFile(filePath, (sourceFile) => {
      const importEditor = new ImportEditor()

      importEditor.ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')
      importEditor.ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/config')
    })

    await expect(readFile(filePath, 'utf8')).resolves.toMatch(
      /^import \{ ConfigModule \} from '@nestjs\/config'/m
    )

    const content = await readFile(filePath, 'utf8')
    expect(content.match(/ConfigModule/g)).toHaveLength(1)
  })

  it('adds a named import to an existing import declaration', async () => {
    const filePath = await writeTempSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({})\nexport class AppModule {}\n"
    )

    await editSourceFile(filePath, (sourceFile) => {
      new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/common')
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(/import \{[^}]*Module[^}]*ConfigModule[^}]*\} from '@nestjs\/common'/)
  })

  it('preserves aliased named imports when adding another import to the same declaration', async () => {
    const filePath = await writeTempSourceFile(
      "import { Module as NestModule } from '@nestjs/common'\n\n@NestModule({})\nexport class AppModule {}\n"
    )

    await editSourceFile(filePath, (sourceFile) => {
      new ImportEditor().ensureNamedImport(sourceFile, 'ConfigModule', '@nestjs/common')
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /import \{[^}]*Module as NestModule[^}]*ConfigModule[^}]*\} from '@nestjs\/common'/
    )
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
  const directory = await mkdtemp(join(tmpdir(), 'knitto-ast-import-editor-'))
  const filePath = join(directory, 'app.module.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
