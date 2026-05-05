import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AstNestAddBootstrapCallOperation } from '@core/generation/ast-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { VariableRenderer } from '../variable-renderer'
import { AstNestAddBootstrapCallHandler } from './ast-nest-add-bootstrap-call.handler'

describe('AstNestAddBootstrapCallHandler', () => {
  it('updates main.ts with app.useLogger(app.get(Logger))', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await createHandler().execute(createOperation(filePath), createContext())

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain('app.useLogger(app.get(Logger))')
    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+app\.useLogger\(app\.get\(Logger\)\)\s+await app\.listen\(3000\)/
    )
  })

  it('is idempotent when the same operation runs twice', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())
    const handler = createHandler()
    const context = createContext()
    const operation = createOperation(filePath)

    await handler.execute(operation, context)
    await handler.execute(operation, context)

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.useLogger\(app\.get\(Logger\)\)/g)).toHaveLength(1)
  })
})

function createHandler() {
  return new AstNestAddBootstrapCallHandler()
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
    nestBootstrapEditor: new NestBootstrapEditor(),
    variables: {},
  }
}

function createOperation(target: string): AstNestAddBootstrapCallOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-call',
    origin: { type: 'feature', slug: 'logger' },
    description: 'add bootstrap logger call',
    target,
    appVar: 'app',
    call: {
      method: 'useLogger',
      arguments: [
        {
          kind: 'call',
          callee: {
            kind: 'member',
            object: 'app',
            property: 'get',
          },
          arguments: [{ kind: 'identifier', name: 'Logger' }],
        },
      ],
    },
  }
}

function createBootstrapSource(): string {
  return [
    "import { Logger } from '@nestjs/common'",
    "import { NestFactory } from '@nestjs/core'",
    '',
    'async function bootstrap() {',
    '  const app = await NestFactory.create(AppModule)',
    '  await app.listen(3000)',
    '}',
    '',
    'bootstrap()',
    '',
  ].join('\n')
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(
    join(tmpdir(), 'knitto-compose-ast-nest-bootstrap-handler-')
  )
  const filePath = join(directory, 'main.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
