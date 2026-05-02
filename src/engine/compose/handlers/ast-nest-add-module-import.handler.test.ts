import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AstNestAddModuleImportOperation } from '@core/generation/ast-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { VariableRenderer } from '../variable-renderer'
import { AstNestAddModuleImportHandler } from './ast-nest-add-module-import.handler'

describe('AstNestAddModuleImportHandler', () => {
  it('updates app.module.ts and preserves existing controllers and providers', async () => {
    const filePath = await writeTempSourceFile(
      [
        "import { Module } from '@nestjs/common'",
        "import { AppController } from './app.controller'",
        "import { AppService } from './app.service'",
        '',
        '@Module({',
        '  controllers: [AppController],',
        '  providers: [AppService],',
        '})',
        'export class AppModule {}',
        '',
      ].join('\n')
    )

    await createHandler().execute(createOperation(filePath), createContext())

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain("import { ConfigModule } from '@nestjs/config'")
    expect(content).toMatch(/@Module\(\{[\s\S]*imports: \[ConfigModule\]/)
    expect(content).toContain('controllers: [AppController]')
    expect(content).toContain('providers: [AppService]')
  })

  it('is idempotent when the same module import is applied twice', async () => {
    const filePath = await writeTempSourceFile(
      "import { Module } from '@nestjs/common'\n\n@Module({ imports: [] })\nexport class AppModule {}\n"
    )

    const handler = createHandler()
    const context = createContext()
    const operation = createOperation(filePath)

    await handler.execute(operation, context)
    await handler.execute(operation, context)

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/import \{ ConfigModule \} from '@nestjs\/config'/g)).toHaveLength(1)
    expect(content.match(/imports: \[ConfigModule\]/g)).toHaveLength(1)
  })
})

function createHandler() {
  return new AstNestAddModuleImportHandler()
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

function createOperation(target: string): AstNestAddModuleImportOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-module-import',
    origin: { type: 'feature', slug: 'config' },
    description: 'add ConfigModule to AppModule imports',
    target,
    namedImport: {
      name: 'ConfigModule',
      from: '@nestjs/config',
    },
    moduleName: 'ConfigModule',
  }
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'knitto-compose-ast-nest-handler-'))
  const filePath = join(directory, 'app.module.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
