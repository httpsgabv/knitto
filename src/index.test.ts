import { afterEach, describe, expect, it, vi } from 'vitest'

describe('src/index', () => {
  afterEach(() => {
    vi.doUnmock('./cli/index')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('runs main on module import', async () => {
    const main = vi.fn().mockResolvedValue(undefined)
    vi.doMock('./cli/index', () => ({ main }))

    await import('./index')

    expect(main).toHaveBeenCalledTimes(1)
  })

  it('logs the error and exits when main rejects', async () => {
    const error = new Error('boom')
    const main = vi.fn().mockRejectedValue(error)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    vi.doMock('./cli/index', () => ({ main }))

    await import('./index')

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error)
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
