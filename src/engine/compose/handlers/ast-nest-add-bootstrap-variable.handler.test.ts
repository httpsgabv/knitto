import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AstNestAddBootstrapVariableOperation } from '@core/generation/ast-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { VariableRenderer } from '../variable-renderer'
import { AstNestAddBootstrapVariableHandler } from './ast-nest-add-bootstrap-variable.handler'

describe('AstNestAddBootstrapVariableHandler', () => {
  it('updates main.ts with a bootstrap variable declaration', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await createHandler().execute(createOperation(filePath), createContext())

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain('const logger = createLogger(config)')
    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+const config = createConfig\(\)\s+const logger = createLogger\(config\)\s+await app\.listen\(3000\)/
    )
  })
})

function createHandler() {
  return new AstNestAddBootstrapVariableHandler()
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

function createOperation(target: string): AstNestAddBootstrapVariableOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-variable',
    origin: { type: 'feature', slug: 'logger' },
    description: 'add bootstrap logger variable',
    target,
    declarationKind: 'const',
    name: 'logger',
    initializer: {
      kind: 'call',
      callee: {
        kind: 'identifier',
        name: 'createLogger',
      },
      arguments: [{ kind: 'identifier', name: 'config' }],
    },
  }
}

function createBootstrapSource(): string {
  return [
    "import { NestFactory } from '@nestjs/core'",
    '',
    'async function bootstrap() {',
    '  const app = await NestFactory.create(AppModule)',
    '  const config = createConfig()',
    '  await app.listen(3000)',
    '}',
    '',
    'bootstrap()',
    '',
  ].join('\n')
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(
    join(tmpdir(), 'knitto-compose-ast-nest-bootstrap-variable-handler-')
  )
  const filePath = join(directory, 'main.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
}
