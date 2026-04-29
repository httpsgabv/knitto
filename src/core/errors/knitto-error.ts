export class KnittoError extends Error {
  public readonly code: string
  public readonly details?: unknown

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.name = 'KnittoError'
    this.code = code
    this.details = details
  }
}
