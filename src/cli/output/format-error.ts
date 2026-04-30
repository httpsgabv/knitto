import { ZodError } from 'zod'
import { KnittoError } from '../../core/errors/knitto-error'

export function formatError(error: unknown) {
  if (error instanceof KnittoError) {
    return error.code ? `[${error.code}] ${error.message}` : error.message
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? 'Validation failed'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
