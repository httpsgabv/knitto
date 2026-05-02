import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AstAddNamedImportOperation } from '@core/generation/ast-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { VariableRenderer } from '../variable-renderer'
import { AstAddNamedImportHandler } from './ast-add-named-import.handler'

describe('AstAddNamedImportHandler', () => {
  it('adds a named import to the target file', async () => {
    const filePath = await writeTempSourceFile('const value = 1\n')

    await createHandler().execute(createOperation(filePath), createContext())

    await expect(readFile(filePath, 'utf8')).resolves.toContain(
      "import { ConfigModule } from '@nestjs/config'"
    )
  })

  it('is idempotent when applied twice', async () => {
    const filePath = await writeTempSourceFile('const value = 1\n')
    const handler = createHandler()
    const context = createContext()
    const operation = createOperation(filePath)

    await handler.execute(operation, context)
    await handler.execute(operation, context)

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/import \{ ConfigModule \} from '@nestjs\/config'/g)).toHaveLength(1)
  })
})

function createHandler() {
  return new AstAddNamedImportHandler()
}

function createContext() {
  return {
    fileSystem: {} as never,
    variableRenderer: new VariableRenderer(),
    packageJsonMerger: {} as never,
    envMerger: {} as never,
    readmeMerger: {} as never,
    sourceFileEditor: new SourceFileEditor(new TsMorphProjectFactory()),
    importEditor: new ImportEditor(),
    nestModuleEditor: new NestModuleEditor(),
    variables: {},
  }
}

function createOperation(target: string): AstAddNamedImportOperation {
  return {
    id: 'op-1',
    type: 'ast.add-named-import',
    origin: { type: 'feature', slug: 'config' },
    description: 'add ConfigModule import',
    target,
    named: 'ConfigModule',
    from: '@nestjs/config',
  }
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'knitto-compose-ast-import-handler-'))
  const filePath = join(directory, 'app.module.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
