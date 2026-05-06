import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
  AstNestAddBootstrapCallOperation,
  AstNestAddBootstrapMethodCallOperation,
} from '@core/generation/ast-operation'
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

  it('inserts standalone bootstrap method calls with multiple arguments and object literals after NestFactory.create by default', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapMethodCall({
        sourceFile,
        receiver: {
          kind: 'identifier',
          name: 'configService',
        },
        method: 'set',
        arguments: standaloneSetCall.arguments,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+configService\.set\('feature', \{ enabled: true, retries: 3 \}\)\s+await app\.listen\(3000\)/
    )
  })

  it('does not duplicate an equivalent standalone bootstrap method call', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      "  configService.set('feature', { retries: 3, enabled: true })",
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapMethodCall({
        sourceFile,
        receiver: {
          kind: 'identifier',
          name: 'configService',
        },
        method: 'set',
        arguments: standaloneSetCall.arguments,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/configService\.set\(/g)).toHaveLength(1)
  })

  it('is idempotent when ensureBootstrapMethodCall is run twice in one edit pass', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      const editor = new NestBootstrapEditor()

      editor.ensureBootstrapMethodCall({
        sourceFile,
        receiver: standaloneSetCall.receiver,
        method: standaloneSetCall.method,
        arguments: standaloneSetCall.arguments,
      })
      editor.ensureBootstrapMethodCall({
        sourceFile,
        receiver: standaloneSetCall.receiver,
        method: standaloneSetCall.method,
        arguments: standaloneSetCall.arguments,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/configService\.set\(/g)).toHaveLength(1)
  })

  it('is idempotent when ensureBootstrapMethodCall is run twice for an app receiver', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await editSourceFile(filePath, (sourceFile) => {
      const editor = new NestBootstrapEditor()

      editor.ensureBootstrapMethodCall({
        sourceFile,
        receiver: {
          kind: 'identifier',
          name: 'app',
        },
        method: 'enableShutdownHooks',
        arguments: [],
      })
      editor.ensureBootstrapMethodCall({
        sourceFile,
        receiver: {
          kind: 'identifier',
          name: 'app',
        },
        method: 'enableShutdownHooks',
        arguments: [],
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/app\.enableShutdownHooks\(\)/g)).toHaveLength(1)
  })

  it('inserts standalone bootstrap method calls after the latest required local declaration', async () => {
    const filePath = await writeTempSourceFile([
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
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapMethodCall({
        sourceFile,
        receiver: {
          kind: 'identifier',
          name: 'configService',
        },
        method: 'apply',
        arguments: [
          {
            kind: 'identifier',
            name: 'config',
          },
        ],
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+const config = createConfig\(\)\s+configService\.apply\(config\)\s+await app\.listen\(3000\)/
    )
  })

  it('throws when a standalone bootstrap method call depends on a local declaration that appears only after app.listen', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  await app.listen(3000)',
      '  const config = createConfig()',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'identifier',
            name: 'configService',
          },
          method: 'apply',
          arguments: [
            {
              kind: 'identifier',
              name: 'config',
            },
          ],
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
      message:
        'Bootstrap method call "configService.apply(...)" depends on local declarations that appear after app.listen(...) in bootstrap().',
    })
  })

  it('renders member receivers and treats equivalent existing standalone method calls as duplicates', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      "  services.logger.flush('boot')",
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapMethodCall({
        sourceFile,
        receiver: memberReceiverFlushCall.receiver,
        method: memberReceiverFlushCall.method,
        arguments: memberReceiverFlushCall.arguments,
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/services\.logger\.flush\('boot'\)/g)).toHaveLength(1)
  })

  it('throws when an equivalent standalone bootstrap method call already exists after app.listen', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  await app.listen(3000)',
      "  configService.set('feature', { retries: 3, enabled: true })",
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: standaloneSetCall.receiver,
          method: standaloneSetCall.method,
          arguments: standaloneSetCall.arguments,
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
      message:
        'Bootstrap method call "configService.set(...)" already exists after app.listen(...) in bootstrap().',
    })
  })

  it('throws when a standalone bootstrap method call receiver is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'identifier',
            name: 'config-service',
          },
          method: 'set',
          arguments: [],
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message:
        'Expected bootstrap method call receiver identifier "config-service" to be a legal identifier.',
    })
  })

  it('throws when a standalone bootstrap method call member receiver property is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'member',
            object: 'services',
            property: 'bad-property',
          },
          method: 'flush',
          arguments: [],
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message:
        'Expected bootstrap method call receiver property "bad-property" to be a legal identifier.',
    })
  })

  it('throws when a standalone bootstrap method call member receiver object is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'member',
            object: 'bad-object',
            property: 'logger',
          },
          method: 'flush',
          arguments: [],
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message:
        'Expected bootstrap method call receiver object "bad-object" to be a legal identifier.',
    })
  })

  it('inserts bootstrap variables after the latest required local declaration and before app.listen', async () => {
    const filePath = await writeTempSourceFile([
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
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapVariable({
        sourceFile,
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
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content).toMatch(
      /const app = await NestFactory\.create\(AppModule\)\s+const config = createConfig\(\)\s+const logger = createLogger\(config\)\s+await app\.listen\(3000\)/
    )
  })

  it('does not duplicate an equivalent bootstrap variable declaration', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  const logger = createLogger({ pretty: true })',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await editSourceFile(filePath, (sourceFile) => {
      new NestBootstrapEditor().ensureBootstrapVariable({
        sourceFile,
        declarationKind: 'const',
        name: 'logger',
        initializer: {
          kind: 'call',
          callee: {
            kind: 'identifier',
            name: 'createLogger',
          },
          arguments: [
            {
              kind: 'object',
              properties: [
                {
                  key: 'pretty',
                  value: { kind: 'boolean', value: true },
                },
              ],
            },
          ],
        },
      })
    })

    const content = await readFile(filePath, 'utf8')

    expect(content.match(/const logger = createLogger\(/g)).toHaveLength(1)
  })

  it('throws when the same bootstrap variable name already exists with a different initializer', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  const logger = createLogger()',
      '  await app.listen(3000)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapVariable({
          sourceFile,
          declarationKind: 'const',
          name: 'logger',
          initializer: {
            kind: 'call',
            callee: {
              kind: 'identifier',
              name: 'createLogger',
            },
            arguments: [{ kind: 'string', value: 'json' }],
          },
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: 'AST_BOOTSTRAP_VARIABLE_CONFLICT',
      message:
        'Bootstrap variable "logger" already exists in bootstrap() with a different declaration.',
    })
  })

  it('throws when a bootstrap variable depends on a local declaration that appears only after app.listen', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  await app.listen(3000)',
      '  const config = createConfig()',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapVariable({
          sourceFile,
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
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
      message:
        'Bootstrap variable "logger" depends on local declarations that appear after app.listen(...) in bootstrap().',
    })
  })

  it('throws when an equivalent bootstrap variable already exists after app.listen', async () => {
    const filePath = await writeTempSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  await app.listen(3000)',
      '  const logger = createLogger({ pretty: true })',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapVariable({
          sourceFile,
          declarationKind: 'const',
          name: 'logger',
          initializer: {
            kind: 'call',
            callee: {
              kind: 'identifier',
              name: 'createLogger',
            },
            arguments: [
              {
                kind: 'object',
                properties: [
                  {
                    key: 'pretty',
                    value: { kind: 'boolean', value: true },
                  },
                ],
              },
            ],
          },
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
      message:
        'Bootstrap variable "logger" already exists after app.listen(...) in bootstrap().',
    })
  })

  it('throws when a bootstrap variable name is not a legal identifier', async () => {
    const filePath = await writeTempSourceFile(createBootstrapSource())

    await expect(
      editSourceFile(filePath, (sourceFile) => {
        new NestBootstrapEditor().ensureBootstrapVariable({
          sourceFile,
          declarationKind: 'const',
          name: 'bad-name',
          initializer: {
            kind: 'number',
            value: 1,
          },
        })
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Expected bootstrap variable name "bad-name" to be a legal identifier.',
    })
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

const standaloneSetCall: Pick<
  AstNestAddBootstrapMethodCallOperation,
  'receiver' | 'method' | 'arguments'
> = {
  receiver: {
    kind: 'identifier',
    name: 'configService',
  },
  method: 'set',
  arguments: [
    {
      kind: 'string',
      value: 'feature',
    },
    {
      kind: 'object',
      properties: [
        {
          key: 'enabled',
          value: {
            kind: 'boolean',
            value: true,
          },
        },
        {
          key: 'retries',
          value: {
            kind: 'number',
            value: 3,
          },
        },
      ],
    },
  ],
}

const memberReceiverFlushCall: Pick<
  AstNestAddBootstrapMethodCallOperation,
  'receiver' | 'method' | 'arguments'
> = {
  receiver: {
    kind: 'member',
    object: 'services',
    property: 'logger',
  },
  method: 'flush',
  arguments: [
    {
      kind: 'string',
      value: 'boot',
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
