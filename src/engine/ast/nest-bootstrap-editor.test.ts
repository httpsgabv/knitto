import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AstNestAddBootstrapCallOperation } from '@core/generation/ast-operation'
import { describe, expect, it } from 'vitest'
import { NestBootstrapEditor } from './nest-bootstrap-editor'
import { SourceFileEditor } from './source-file-editor'
import { TsMorphProjectFactory } from './ts-morph-project-factory'

describe('NestBootstrapEditor', () => {
  it('inserts app.useLogger(app.get(Logger)) after NestFactory.create', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useLoggerCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain('const app = await NestFactory.create(AppModule)')
    expect(content).toContain('app.useLogger(app.get(Logger))')
    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+app\.useLogger\(app\.get\(Logger\)\)\s+await app\.listen\(3000\)/
    )
  })

  it('is idempotent when run twice', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      const editor = new NestBootstrapEditor()

      editor.ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useLoggerCall,
      })
      editor.ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useLoggerCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.useLogger\(app\.get\(Logger\)\)/g)).toHaveLength(1)
  })

  it('preserves bootstrap call insertion order across sequential operations', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      const editor = new NestBootstrapEditor()

      editor.ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: firstCall,
      })
      editor.ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: secondCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+app\.enableCors\(\)\s+app\.useLogger\(app\.get\(Logger\)\)\s+await app\.listen\(3000\)/
    )
  })

  it('does not duplicate a semantically equivalent existing call with different formatting', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      "  app.enableCors({ 'x-api-key': true, credentials: true })",
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: enableCorsCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.enableCors\(/g)).toHaveLength(1)
  })

  it('renders constructor expressions and treats equivalent existing constructor calls as duplicates', async () => {
    const filePath = await writeTempSourceFile([
      "import { ValidationPipe } from '@nestjs/common'",
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  app.useGlobalPipes(new ValidationPipe({ transform: true }))',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useGlobalPipesCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.useGlobalPipes\(/g)).toHaveLength(1)
    expect(content).toContain('app.useGlobalPipes(new ValidationPipe({ transform: true }))')
  })

  it('inserts after required local bootstrap declarations referenced by the call', async () => {
    const filePath = await writeTempSourceFile([
      "import { Logger } from '@nestjs/common'",
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  const logger = app.get(Logger)',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: {
          method: 'useLogger',
          arguments: [{ kind: 'identifier', name: 'logger' }],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+const logger = app\.get\(Logger\)\s+app\.useLogger\(logger\)\s+await app\.listen\(3000\)/
    )
  })

  it('does not move before a required declaration when an earlier bootstrap call already exists', async () => {
    const filePath = await writeTempSourceFile([
      "import { Logger } from '@nestjs/common'",
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  app.enableCors()',
      '  const logger = app.get(Logger)',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: {
          method: 'useLogger',
          arguments: [{ kind: 'identifier', name: 'logger' }],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+app\.enableCors\(\)\s+const logger = app\.get\(Logger\)\s+app\.useLogger\(logger\)\s+await app\.listen\(3000\)/
    )
  })

  it('inserts after a later local class declaration referenced by a constructor expression', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  class ValidationPipe {}',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: {
          method: 'useGlobalPipes',
          arguments: [
            {
              kind: 'new',
              constructor: {
                kind: 'identifier',
                name: 'ValidationPipe',
              },
              arguments: [],
            },
          ],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+class ValidationPipe \{\}\s+app\.useGlobalPipes\(new ValidationPipe\(\)\)\s+await app\.listen\(3000\)/
    )
  })

  it('treats object literal properties with the same content in different order as duplicates', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      "  app.enableCors({ credentials: true, 'x-api-key': true })",
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: enableCorsCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.enableCors\(/g)).toHaveLength(1)
  })

  it('treats shorthand object literal properties as duplicates where the values are equivalent', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  const credentials = true',
      '  app.enableCors({ credentials })',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: {
          method: 'enableCors',
          arguments: [
            {
              kind: 'object',
              properties: [
                {
                  key: 'credentials',
                  value: { kind: 'identifier', name: 'credentials' },
                },
              ],
            },
          ],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.enableCors\(/g)).toHaveLength(1)
  })

  it('renders escaped strings and quotes unsafe object keys', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: setConfigCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain("app.setConfig({ 'x-api-key': 'line 1\\nline 2\\'s path \\\\ root' })")
  })

  it('throws when a bootstrap method name is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: {
            method: 'use-logger',
            arguments: [],
          },
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected bootstrap call method "use-logger" to be a legal identifier.',
    })
  })

  it('throws when a member expression property is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: {
            method: 'useLogger',
            arguments: [
              {
                kind: 'member',
                object: 'app',
                property: 'bad-property',
              },
            ],
          },
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected member property "bad-property" to be a legal identifier.',
    })
  })

  it('throws when bootstrap is missing', async () => {
    const filePath = await writeTempSourceFile('export const main = async () => {}\n')

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Could not find a bootstrap() function in the source file.',
    })
  })

  it('throws when app variable is missing', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  await NestFactory.create(AppModule)',
      '}',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Could not find app variable declaration in bootstrap() scope.',
    })
  })

  it('throws when app variable is not created by NestFactory.create(...)', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = createApp()',
      '}',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected app to be initialized by NestFactory.create(...) in bootstrap().',
    })
  })

  it('accepts a parenthesized awaited NestFactory.create(...) initializer', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = (await NestFactory.create(AppModule))',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useLoggerCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain('app.useLogger(app.get(Logger))')
  })

  it('accepts an as-asserted awaited NestFactory.create(...) initializer', async () => {
    const filePath = await writeTempSourceFile([
      "import type { INestApplication } from '@nestjs/common'",
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = (await NestFactory.create(AppModule)) as INestApplication',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: useLoggerCall,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toContain('app.useLogger(app.get(Logger))')
  })

  it('treats an existing negative numeric literal as a duplicate', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  app.setGlobalPrefix(-1)',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapCall({
        sourceFile,
        appVar: 'app',
        call: {
          method: 'setGlobalPrefix',
          arguments: [
            {
              kind: 'number',
              value: -1,
            },
          ],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.setGlobalPrefix\(-1\)/g)).toHaveLength(1)
  })
})

const useLoggerCall: AstNestAddBootstrapCallOperation['call'] = {
  method: 'useLogger',
  arguments: [
    {
      kind: 'call',
      callee: {
        kind: 'member',
        object: 'app',
        property: 'get',
      },
      arguments: [
        {
          kind: 'identifier',
          name: 'Logger',
        },
      ],
    },
  ],
}

const firstCall: AstNestAddBootstrapCallOperation['call'] = {
  method: 'enableCors',
  arguments: [],
}

const secondCall = useLoggerCall

const enableCorsCall: AstNestAddBootstrapCallOperation['call'] = {
  method: 'enableCors',
  arguments: [
    {
      kind: 'object',
      properties: [
        {
          key: 'x-api-key',
          value: {
            kind: 'boolean',
            value: true,
          },
        },
        {
          key: 'credentials',
          value: {
            kind: 'boolean',
            value: true,
          },
        },
      ],
    },
  ],
}

const useGlobalPipesCall: AstNestAddBootstrapCallOperation['call'] = {
  method: 'useGlobalPipes',
  arguments: [
    {
      kind: 'new',
      constructor: {
        kind: 'identifier',
        name: 'ValidationPipe',
      },
      arguments: [
        {
          kind: 'object',
          properties: [
            {
              key: 'transform',
              value: {
                kind: 'boolean',
                value: true,
              },
            },
          ],
        },
      ],
    },
  ],
}

const setConfigCall: AstNestAddBootstrapCallOperation['call'] = {
  method: 'setConfig',
  arguments: [
    {
      kind: 'object',
      properties: [
        {
          key: 'x-api-key',
          value: {
            kind: 'string',
            value: "line 1\nline 2's path \\ root",
          },
        },
      ],
    },
  ],
}

const projectFactory = new TsMorphProjectFactory()
const sourceFileEditor = new SourceFileEditor(projectFactory)

async function editSourceFile(
  filePath: string,
  edit: Parameters<SourceFileEditor['edit']>[1]
): Promise<void> {
  await sourceFileEditor.edit(filePath, edit)
}

async function writeTempSourceFile(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'knitto-ast-nest-bootstrap-editor-'))
  const filePath = join(directory, 'main.ts')

  await writeFile(filePath, content, 'utf8')

  return filePath
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
