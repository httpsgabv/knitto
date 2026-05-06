import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AstNestAddBootstrapMethodCallOperation } from '@core/generation/ast-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { VariableRenderer } from '../variable-renderer'
import { AstNestAddBootstrapMethodCallHandler } from './ast-nest-add-bootstrap-method-call.handler'

describe('AstNestAddBootstrapMethodCallHandler', () => {
  it('updates main.ts with a standalone bootstrap method call', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await createHandler().execute(createOperation(filePath), createContext())

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain("app.enableShutdownHooks(signalStore.getSignals())")
    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+const signalStore = createSignalStore\(\)\s+app\.enableShutdownHooks\(signalStore\.getSignals\(\)\)\s+await app\.listen\(3000\)/
    )
  })

  it('is idempotent when executed twice for an app receiver method call', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())
    const handler = createHandler()
    const operation = createOperation(filePath)
    const context = createContext()

    await handler.execute(operation, context)
    await handler.execute(operation, context)

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.enableShutdownHooks\(signalStore\.getSignals\(\)\)/g)).toHaveLength(1)
  })
})

function createHandler() {
  return new AstNestAddBootstrapMethodCallHandler()
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

function createOperation(target: string): AstNestAddBootstrapMethodCallOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-method-call',
    origin: { type: 'feature', slug: 'shutdown-hooks' },
    description: 'add bootstrap shutdown hook call',
    target,
    receiver: {
      kind: 'identifier',
      name: 'app',
    },
    method: 'enableShutdownHooks',
    arguments: [
      {
        kind: 'call',
        callee: {
          kind: 'member',
          object: 'signalStore',
          property: 'getSignals',
        },
        arguments: [],
      },
    ],
  }
}

function createBootstrapSource(): string {
  return [
    "import { NestFactory } from '@nestjs/core'",
    '',
    'async function bootstrap() {',
    '  const app = await NestFactory.create(AppModule)',
    '  const signalStore = createSignalStore()',
    '  await app.listen(3000)',
    '}',
    '',
    'bootstrap()',
    '',
  ].join('\n')
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(
    join(tmpdir(), 'knitto-compose-ast-nest-bootstrap-method-call-handler-')
  )
  const filePath = join(directory, 'main.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
