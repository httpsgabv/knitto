import { vi } from 'vitest'

export class FakeSpinner {
  succeed: () => void = vi.fn()
  fail: () => void = vi.fn()
  start: () => FakeSpinner = vi.fn()
}
