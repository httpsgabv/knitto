import { describe, expect, it } from 'vitest'
import { FakeProjectFactory } from '@test/engine/ast/fake-project-factory'
import { SourceFileEditor } from './source-file-editor'

describe('SourceFileEditor', () => {
  it('creates a project, loads the source file, passes it to the callback, and saves it', async () => {
    const projectFactory = new FakeProjectFactory()
    const editor = new SourceFileEditor(projectFactory)
    const filePath = '/tmp/app.module.ts'
    const callbackEvents: string[] = []
    let callbackCalls = 0
    let callbackSourceFile: unknown = undefined

    await editor.edit(filePath, async (sourceFile) => {
      callbackCalls += 1
      callbackSourceFile = sourceFile
      callbackEvents.push('callback')

      expect(projectFactory.createCalls).toBe(1)
      expect(projectFactory.project.addSourceFileAtPathCalls).toEqual([filePath])
      expect(projectFactory.sourceFile.saveCalls).toBe(0)
    })

    expect(projectFactory.createCalls).toBe(1)
    expect(projectFactory.project.addSourceFileAtPathCalls).toEqual([filePath])
    expect(callbackCalls).toBe(1)
    expect(callbackSourceFile).toBe(projectFactory.sourceFile.instance)
    expect(callbackEvents).toEqual(['callback'])
    expect(projectFactory.sourceFile.saveCalls).toBe(1)
    expect(projectFactory.sourceFile.events).toEqual(['save'])
  })

  it('waits for the callback to resolve before saving', async () => {
    const projectFactory = new FakeProjectFactory()
    const editor = new SourceFileEditor(projectFactory)
    let resolveCallback: (() => void) | undefined

    const editPromise = editor.edit('/tmp/main.ts', async () => {
      projectFactory.sourceFile.events.push('callback:start')

      await new Promise<void>((resolve) => {
        resolveCallback = resolve
      })

      projectFactory.sourceFile.events.push('callback:end')
    })

    expect(projectFactory.sourceFile.events).toEqual(['callback:start'])
    expect(projectFactory.sourceFile.saveCalls).toBe(0)

    resolveCallback?.call(undefined)
    await editPromise

    expect(projectFactory.sourceFile.events).toEqual(['callback:start', 'callback:end', 'save'])
    expect(projectFactory.sourceFile.saveCalls).toBe(1)
  })

  it('rejects and does not save when the callback throws', async () => {
    const projectFactory = new FakeProjectFactory()
    const editor = new SourceFileEditor(projectFactory)
    const error = new Error('callback failed')

    await expect(
      editor.edit('/tmp/main.ts', async () => {
        projectFactory.sourceFile.events.push('callback:start')
        throw error
      })
    ).rejects.toBe(error)

    expect(projectFactory.createCalls).toBe(1)
    expect(projectFactory.project.addSourceFileAtPathCalls).toEqual(['/tmp/main.ts'])
    expect(projectFactory.sourceFile.events).toEqual(['callback:start'])
    expect(projectFactory.sourceFile.saveCalls).toBe(0)
  })
})
