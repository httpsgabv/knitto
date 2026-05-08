import { describe, expect, it } from 'vitest'
import type { CopyFileOperation } from '@core/generation/file-operation'
import { ImportEditor } from '@engine/ast/import-editor'
import { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import { NestModuleEditor } from '@engine/ast/nest-module-editor'
import { SourceFileEditor } from '@engine/ast/source-file-editor'
import { TsMorphProjectFactory } from '@engine/ast/ts-morph-project-factory'
import { FakeFileSystem } from '../../../../test/adapters/fs/fake-file-system'
import { VariableRenderer } from '../variable-renderer'
import { CopyFileHandler } from './copy-file.handler'

describe('CopyFileHandler', () => {
  it('should render variables and write the copied file', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile('/template/README.md', 'Hello {{name}}!')

    const handler = new CopyFileHandler()
    const operation: CopyFileOperation = {
      id: 'op-1',
      type: 'copy-file',
      origin: { type: 'kit', slug: 'base' },
      description: 'copy readme',
      source: '/template/README.md',
      target: '/project/docs/README.md',
      renderVariables: true,
      overwrite: true,
    }

    //@ts-expect-error TODO: fix
    await handler.execute(operation, {
      fileSystem,
      variableRenderer: new VariableRenderer(),
      packageJsonMerger: {} as never,
      envMerger: {} as never,
      readmeMerger: {} as never,
      sourceFileEditor: new SourceFileEditor(new TsMorphProjectFactory()),
      importEditor: new ImportEditor(),
      nestModuleEditor: new NestModuleEditor(),
      nestBootstrapEditor: new NestBootstrapEditor(),
      variables: { name: 'Knitto' },
    })

    expect(fileSystem.getCalls()).toEqual([
      { method: 'readFile', args: ['/template/README.md', 'utf-8'] },
      { method: 'ensureDir', args: ['/project/docs'] },
      {
        method: 'writeFile',
        args: ['/project/docs/README.md', 'Hello Knitto!'],
      },
    ])
  })

  it('writes the original content when renderVariables is false', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile('/template/README.md', 'Hello {{name}}!')

    const handler = new CopyFileHandler()
    const operation: CopyFileOperation = {
      id: 'op-2',
      type: 'copy-file',
      origin: { type: 'kit', slug: 'base' },
      description: 'copy readme without rendering',
      source: '/template/README.md',
      target: '/project/docs/README.md',
      renderVariables: false,
      overwrite: true,
    }

    //@ts-expect-error TODO: fix
    await handler.execute(operation, {
      fileSystem,
      variableRenderer: new VariableRenderer(),
      packageJsonMerger: {} as never,
      envMerger: {} as never,
      readmeMerger: {} as never,
      sourceFileEditor: new SourceFileEditor(new TsMorphProjectFactory()),
      importEditor: new ImportEditor(),
      nestModuleEditor: new NestModuleEditor(),
      nestBootstrapEditor: new NestBootstrapEditor(),
      variables: { name: 'Knitto' },
    })

    expect(fileSystem.getCalls()).toEqual([
      { method: 'readFile', args: ['/template/README.md', 'utf-8'] },
      { method: 'ensureDir', args: ['/project/docs'] },
      {
        method: 'writeFile',
        args: ['/project/docs/README.md', 'Hello {{name}}!'],
      },
    ])
  })

  it('does not overwrite an existing target when overwrite is false', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile('/template/README.md', 'Hello {{name}}!')
    fileSystem.addFile('/project/docs/README.md', 'Existing content')

    const handler = new CopyFileHandler()
    const operation: CopyFileOperation = {
      id: 'op-3',
      type: 'copy-file',
      origin: { type: 'kit', slug: 'base' },
      description: 'copy readme without overwriting',
      source: '/template/README.md',
      target: '/project/docs/README.md',
      renderVariables: true,
      overwrite: false,
    }

    //@ts-expect-error TODO: fix
    await handler.execute(operation, {
      fileSystem,
      variableRenderer: new VariableRenderer(),
      packageJsonMerger: {} as never,
      envMerger: {} as never,
      readmeMerger: {} as never,
      sourceFileEditor: new SourceFileEditor(new TsMorphProjectFactory()),
      importEditor: new ImportEditor(),
      nestModuleEditor: new NestModuleEditor(),
      nestBootstrapEditor: new NestBootstrapEditor(),
      variables: { name: 'Knitto' },
    })

    expect(fileSystem.getCalls()).toEqual([
      { method: 'pathExists', args: ['/project/docs/README.md'] },
    ])
  })
})
