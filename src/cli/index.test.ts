import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KnittoError } from '../core/errors/knitto-error'

type FakeCommandNode = {
  name: ReturnType<typeof vi.fn>
  description: ReturnType<typeof vi.fn>
  version: ReturnType<typeof vi.fn>
  action: ReturnType<typeof vi.fn>
  command: ReturnType<typeof vi.fn>
  parseAsync: ReturnType<typeof vi.fn>
  defaultAction?: () => Promise<void>
  listCommand?: FakeCommandNode
}

let rootCommand: FakeCommandNode
let parseImpl: (() => Promise<void>) | undefined

function createFakeCommand(): FakeCommandNode {
  const command: FakeCommandNode = {
    name: vi.fn(() => command),
    description: vi.fn(() => command),
    version: vi.fn(() => command),
    action: vi.fn((handler: () => Promise<void>) => {
      command.defaultAction = handler
      return command
    }),
    command: vi.fn(() => {
      const listCommand = createFakeCommand()
      command.listCommand = listCommand
      return listCommand
    }),
    parseAsync: vi.fn(() => parseImpl?.() ?? Promise.resolve()),
  }

  return command
}

const createApp = vi.fn()
const makeCreateFlow = vi.fn()
const registerCreateCommand = vi.fn()
const registerListKitsCommand = vi.fn()
const registerDoctorCommand = vi.fn()
const registerListFeaturesCommand = vi.fn()
const printer = { error: vi.fn() }
const formatError = vi.fn(() => 'formatted error')

vi.mock('commander', () => ({
  Command: vi.fn(function Command() {
    rootCommand = createFakeCommand()
    return rootCommand
  }),
}))

vi.mock('./bootstrap', () => ({
  createApp,
}))

vi.mock('./commands/create.command', () => ({
  registerCreateCommand,
}))

vi.mock('./commands/list-kits.command', () => ({
  registerListKitsCommand,
}))

vi.mock('./commands/doctor.command', () => ({
  registerDoctorCommand,
}))

vi.mock('./commands/list-features.command', () => ({
  registerListFeaturesCommand,
}))

vi.mock('./output/printer', () => ({
  printer,
}))

vi.mock('./output/format-error', () => ({
  formatError,
}))

vi.mock('./create-flow', () => ({
  makeCreateFlow,
}))

describe('cli/main', () => {
  const originalArgv = process.argv
  const originalExitCode = process.exitCode

  beforeEach(() => {
    parseImpl = undefined
    rootCommand = undefined as never
    process.argv = ['node', 'knitto', 'create']
    process.exitCode = undefined
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.argv = originalArgv
    process.exitCode = originalExitCode
  })

  it('parses argv successfully and registers the CLI commands', async () => {
    const runCreateFlow = vi.fn().mockResolvedValue(undefined)
    const app = {
      catalog: { kind: 'catalog' },
      createProjectUseCase: { kind: 'use-case' },
    }

    createApp.mockReturnValue(app)
    makeCreateFlow.mockReturnValue(runCreateFlow)

    const { main } = await import('./index')

    await main()

    expect(createApp).toHaveBeenCalledTimes(1)
    expect(makeCreateFlow).toHaveBeenCalledWith({
      catalog: app.catalog,
      createProjectUseCase: app.createProjectUseCase,
    })
    expect(rootCommand.name).toHaveBeenCalledWith('knitto')
    expect(rootCommand.description).toHaveBeenCalledWith(
      'A modular project scaffolding CLI'
    )
    expect(rootCommand.version).toHaveBeenCalledWith('0.1.0')
    expect(rootCommand.parseAsync).toHaveBeenCalledWith(process.argv)
    expect(registerCreateCommand).toHaveBeenCalledWith(rootCommand, runCreateFlow)
    expect(registerListKitsCommand).toHaveBeenCalledWith(
      rootCommand.listCommand,
      app.catalog
    )
    expect(registerListFeaturesCommand).toHaveBeenCalledWith(
      rootCommand.listCommand,
      app.catalog
    )
    expect(registerDoctorCommand).toHaveBeenCalledWith(rootCommand)
    expect(runCreateFlow).not.toHaveBeenCalled()
  })

  it('runs the default action through the create flow', async () => {
    const runCreateFlow = vi.fn().mockResolvedValue(undefined)

    createApp.mockReturnValue({
      catalog: { kind: 'catalog' },
      createProjectUseCase: { kind: 'use-case' },
    })
    makeCreateFlow.mockReturnValue(runCreateFlow)
    parseImpl = async () => {
      await rootCommand.defaultAction?.()
    }

    const { main } = await import('./index')

    await main()

    expect(runCreateFlow).toHaveBeenCalledTimes(1)
  })

  it('formats a KnittoError and sets exitCode to 1', async () => {
    const error = new KnittoError('boom', 'E_BROKEN')

    createApp.mockReturnValue({
      catalog: { kind: 'catalog' },
      createProjectUseCase: { kind: 'use-case' },
    })
    makeCreateFlow.mockReturnValue(vi.fn())
    parseImpl = async () => {
      throw error
    }

    const { main } = await import('./index')

    await expect(main()).resolves.toBeUndefined()

    expect(formatError).toHaveBeenCalledWith(error)
    expect(printer.error).toHaveBeenCalledWith('formatted error')
    expect(process.exitCode).toBe(1)
  })

  it('formats unknown errors and sets exitCode to 1', async () => {
    const error = new Error('boom')

    createApp.mockReturnValue({
      catalog: { kind: 'catalog' },
      createProjectUseCase: { kind: 'use-case' },
    })
    makeCreateFlow.mockReturnValue(vi.fn())
    parseImpl = async () => {
      throw error
    }

    const { main } = await import('./index')

    await expect(main()).resolves.toBeUndefined()

    expect(formatError).toHaveBeenCalledWith(error)
    expect(printer.error).toHaveBeenCalledWith('formatted error')
    expect(process.exitCode).toBe(1)
  })
})
