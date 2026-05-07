import type {
  AstNestAddBootstrapCallOperation,
  AstNestAddBootstrapMethodCallOperation,
} from '@core/generation/ast-operation'
import { describe, expect, it } from 'vitest'
import { Project, QuoteKind, SyntaxKind, type SourceFile } from 'ts-morph'
import { NestBootstrapEditor } from './nest-bootstrap-editor'

describe('NestBootstrapEditor', () => {
  it('inserts app.useLogger(app.get(Logger)) after NestFactory.create', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: useLoggerCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.useLogger(app.get(Logger))',
      'await app.listen(3000)',
    ])
  })

  it('is idempotent when run twice', () => {
    const sourceFile = createSourceFile(createBootstrapSource())
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.useLogger(app.get(Logger))',
      'await app.listen(3000)',
    ])
  })

  it('preserves bootstrap call insertion order across sequential operations', () => {
    const sourceFile = createSourceFile(createBootstrapSource())
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.enableCors()',
      'app.useLogger(app.get(Logger))',
      'await app.listen(3000)',
    ])
  })

  it('does not duplicate a semantically equivalent existing call with different formatting', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: enableCorsCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "app.enableCors({ 'x-api-key': true, credentials: true })",
      'await app.listen(3000)',
    ])
  })

  it('renders constructor expressions and treats equivalent existing constructor calls as duplicates', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: useGlobalPipesCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.useGlobalPipes(new ValidationPipe({ transform: true }))',
      'await app.listen(3000)',
    ])
  })

  it('inserts after required local bootstrap declarations referenced by the call', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: {
        method: 'useLogger',
        arguments: [{ kind: 'identifier', name: 'logger' }],
      },
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const logger = app.get(Logger)',
      'app.useLogger(logger)',
      'await app.listen(3000)',
    ])
  })

  it('does not move before a required declaration when an earlier bootstrap call already exists', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: {
        method: 'useLogger',
        arguments: [{ kind: 'identifier', name: 'logger' }],
      },
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.enableCors()',
      'const logger = app.get(Logger)',
      'app.useLogger(logger)',
      'await app.listen(3000)',
    ])
  })

  it('inserts after a later local class declaration referenced by a constructor expression', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'class ValidationPipe {}',
      'app.useGlobalPipes(new ValidationPipe())',
      'await app.listen(3000)',
    ])
  })

  it('treats object literal properties with the same content in different order as duplicates', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: enableCorsCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "app.enableCors({ credentials: true, 'x-api-key': true })",
      'await app.listen(3000)',
    ])
  })

  it('treats shorthand object literal properties as duplicates where the values are equivalent', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const credentials = true',
      'app.enableCors({ credentials })',
      'await app.listen(3000)',
    ])
  })

  it('renders escaped strings and quotes unsafe object keys', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: setConfigCall,
    })

    expect(getBootstrapStatements(sourceFile)[1]).toBe(
      "app.setConfig({ 'x-api-key': 'line 1\\nline 2\\'s path \\\\ root' })"
    )
  })

  it('throws when a bootstrap method name is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: {
            method: 'use-logger',
            arguments: [],
          },
        }),
      {
        message: 'Expected bootstrap call method "use-logger" to be a legal identifier.',
      }
    )
  })

  it('throws when a member expression property is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
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
        }),
      {
        message: 'Expected member property "bad-property" to be a legal identifier.',
      }
    )
  })

  it('throws when bootstrap is missing', () => {
    const sourceFile = createSourceFile('export const main = async () => {}\n')

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        }),
      {
        message: 'Could not find a bootstrap() function in the source file.',
      }
    )
  })

  it('throws when app variable is missing', () => {
    const sourceFile = createSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  await NestFactory.create(AppModule)',
      '}',
      '',
    ].join('\n'))

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        }),
      {
        message: 'Could not find app variable declaration in bootstrap() scope.',
      }
    )
  })

  it('throws when app variable is not created by NestFactory.create(...)', () => {
    const sourceFile = createSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = createApp()',
      '}',
      '',
    ].join('\n'))

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapCall({
          sourceFile,
          appVar: 'app',
          call: useLoggerCall,
        }),
      {
        message: 'Expected app to be initialized by NestFactory.create(...) in bootstrap().',
      }
    )
  })

  it('accepts a parenthesized awaited NestFactory.create(...) initializer', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: useLoggerCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = (await NestFactory.create(AppModule))',
      'app.useLogger(app.get(Logger))',
      'await app.listen(3000)',
    ])
  })

  it('accepts an as-asserted awaited NestFactory.create(...) initializer', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapCall({
      sourceFile,
      appVar: 'app',
      call: useLoggerCall,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = (await NestFactory.create(AppModule)) as INestApplication',
      'app.useLogger(app.get(Logger))',
      'await app.listen(3000)',
    ])
  })

  it('treats an existing negative numeric literal as a duplicate', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.setGlobalPrefix(-1)',
      'await app.listen(3000)',
    ])
  })

  it('inserts standalone bootstrap method calls with multiple arguments and object literals after NestFactory.create by default', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    new NestBootstrapEditor().ensureBootstrapMethodCall({
      sourceFile,
      receiver: {
        kind: 'identifier',
        name: 'configService',
      },
      method: 'set',
      arguments: standaloneSetCall.arguments,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "configService.set('feature', { enabled: true, retries: 3 })",
      'await app.listen(3000)',
    ])
  })

  it('does not duplicate an equivalent standalone bootstrap method call', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapMethodCall({
      sourceFile,
      receiver: {
        kind: 'identifier',
        name: 'configService',
      },
      method: 'set',
      arguments: standaloneSetCall.arguments,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "configService.set('feature', { retries: 3, enabled: true })",
      'await app.listen(3000)',
    ])
  })

  it('is idempotent when ensureBootstrapMethodCall is run twice in one edit pass', () => {
    const sourceFile = createSourceFile(createBootstrapSource())
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "configService.set('feature', { enabled: true, retries: 3 })",
      'await app.listen(3000)',
    ])
  })

  it('is idempotent when ensureBootstrapMethodCall is run twice for an app receiver', () => {
    const sourceFile = createSourceFile(createBootstrapSource())
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'app.enableShutdownHooks()',
      'await app.listen(3000)',
    ])
  })

  it('inserts standalone bootstrap method calls after the latest required local declaration', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const config = createConfig()',
      'configService.apply(config)',
      'await app.listen(3000)',
    ])
  })

  it('inserts standalone bootstrap method calls at the end of bootstrap when app.listen is absent', () => {
    const sourceFile = createSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '  const config = createConfig()',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const config = createConfig()',
      'configService.apply(config)',
    ])
  })

  it('throws when a standalone bootstrap method call depends on a local declaration that appears only after app.listen', () => {
    const sourceFile = createSourceFile([
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

    expectKnittoError(
      () =>
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
        }),
      {
        code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
        message:
          'Bootstrap method call "configService.apply(...)" depends on local declarations that appear after app.listen(...) in bootstrap().',
      }
    )
  })

  it('renders member receivers and treats equivalent existing standalone method calls as duplicates', () => {
    const sourceFile = createSourceFile([
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

    new NestBootstrapEditor().ensureBootstrapMethodCall({
      sourceFile,
      receiver: memberReceiverFlushCall.receiver,
      method: memberReceiverFlushCall.method,
      arguments: memberReceiverFlushCall.arguments,
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      "services.logger.flush('boot')",
      'await app.listen(3000)',
    ])
  })

  it('throws when an equivalent standalone bootstrap method call already exists after app.listen', () => {
    const sourceFile = createSourceFile([
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

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: standaloneSetCall.receiver,
          method: standaloneSetCall.method,
          arguments: standaloneSetCall.arguments,
        }),
      {
        code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
        message:
          'Bootstrap method call "configService.set(...)" already exists after app.listen(...) in bootstrap().',
      }
    )
  })

  it('throws when a standalone bootstrap method call receiver is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'identifier',
            name: 'config-service',
          },
          method: 'set',
          arguments: [],
        }),
      {
        message:
          'Expected bootstrap method call receiver identifier "config-service" to be a legal identifier.',
      }
    )
  })

  it('throws when a standalone bootstrap method call member receiver property is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'member',
            object: 'services',
            property: 'bad-property',
          },
          method: 'flush',
          arguments: [],
        }),
      {
        message:
          'Expected bootstrap method call receiver property "bad-property" to be a legal identifier.',
      }
    )
  })

  it('throws when a standalone bootstrap method call member receiver object is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'member',
            object: 'bad-object',
            property: 'logger',
          },
          method: 'flush',
          arguments: [],
        }),
      {
        message:
          'Expected bootstrap method call receiver object "bad-object" to be a legal identifier.',
      }
    )
  })

  it('throws when a standalone bootstrap method call method is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapMethodCall({
          sourceFile,
          receiver: {
            kind: 'identifier',
            name: 'configService',
          },
          method: 'bad-method',
          arguments: [],
        }),
      {
        message: 'Expected bootstrap method call method "bad-method" to be a legal identifier.',
      }
    )
  })

  it('inserts bootstrap variables after the latest required local declaration and before app.listen', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const config = createConfig()',
      'const logger = createLogger(config)',
      'await app.listen(3000)',
    ])
  })

  it('inserts bootstrap variables when app.listen is absent', () => {
    const sourceFile = createSourceFile([
      "import { NestFactory } from '@nestjs/core'",
      '',
      'async function bootstrap() {',
      '  const app = await NestFactory.create(AppModule)',
      '}',
      '',
      'bootstrap()',
      '',
    ].join('\n'))

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
        arguments: [],
      },
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const logger = createLogger()',
    ])
  })

  it('is idempotent when ensureBootstrapVariable is run twice in one edit pass', () => {
    const sourceFile = createSourceFile(createBootstrapSource())
    const editor = new NestBootstrapEditor()

    editor.ensureBootstrapVariable({
      sourceFile,
      declarationKind: 'const',
      name: 'logger',
      initializer: {
        kind: 'call',
        callee: {
          kind: 'identifier',
          name: 'createLogger',
        },
        arguments: [],
      },
    })
    editor.ensureBootstrapVariable({
      sourceFile,
      declarationKind: 'const',
      name: 'logger',
      initializer: {
        kind: 'call',
        callee: {
          kind: 'identifier',
          name: 'createLogger',
        },
        arguments: [],
      },
    })

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const logger = createLogger()',
      'await app.listen(3000)',
    ])
  })

  it('does not duplicate an equivalent bootstrap variable declaration', () => {
    const sourceFile = createSourceFile([
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

    expectBootstrapStatements(sourceFile).toEqual([
      'const app = await NestFactory.create(AppModule)',
      'const logger = createLogger({ pretty: true })',
      'await app.listen(3000)',
    ])
  })

  it('throws when the same bootstrap variable name already exists with a different initializer', () => {
    const sourceFile = createSourceFile([
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

    expectKnittoError(
      () =>
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
        }),
      {
        code: 'AST_BOOTSTRAP_VARIABLE_CONFLICT',
        message:
          'Bootstrap variable "logger" already exists in bootstrap() with a different declaration.',
      }
    )
  })

  it('throws when a bootstrap variable depends on a local declaration that appears only after app.listen', () => {
    const sourceFile = createSourceFile([
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

    expectKnittoError(
      () =>
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
        }),
      {
        code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
        message:
          'Bootstrap variable "logger" depends on local declarations that appear after app.listen(...) in bootstrap().',
      }
    )
  })

  it('throws when an equivalent bootstrap variable already exists after app.listen', () => {
    const sourceFile = createSourceFile([
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

    expectKnittoError(
      () =>
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
        }),
      {
        code: 'AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN',
        message: 'Bootstrap variable "logger" already exists after app.listen(...) in bootstrap().',
      }
    )
  })

  it('throws when a bootstrap variable name is not a legal identifier', () => {
    const sourceFile = createSourceFile(createBootstrapSource())

    expectKnittoError(
      () =>
        new NestBootstrapEditor().ensureBootstrapVariable({
          sourceFile,
          declarationKind: 'const',
          name: 'bad-name',
          initializer: {
            kind: 'number',
            value: 1,
          },
        }),
      {
        message: 'Expected bootstrap variable name "bad-name" to be a legal identifier.',
      }
    )
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

function createSourceFile(content: string): SourceFile {
  return new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  }).createSourceFile('main.ts', content)
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

function getBootstrapStatements(sourceFile: SourceFile): string[] {
  const bootstrapFunction = sourceFile.getFunction('bootstrap')

  expect(bootstrapFunction).toBeDefined()

  return bootstrapFunction!
    .getBodyOrThrow()
    .asKindOrThrow(SyntaxKind.Block)
    .getStatements()
    .map((statement) => statement.getText())
}

function expectBootstrapStatements(sourceFile: SourceFile) {
  return expect(getBootstrapStatements(sourceFile))
}

function expectKnittoError(
  run: () => void,
  expected: {
    message: string
    code?: string
  }
) {
  try {
    run()
  } catch (error) {
    expect(error).toMatchObject({
      name: 'KnittoError',
      ...expected,
    })
    return
  }

  throw new Error(`Expected KnittoError: ${expected.message}`)
}
