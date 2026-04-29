import { ZodError } from 'zod'
import type { CreateProjectInput } from './create-project.input'
import {
  CreateProjectInputSchema,
  type CreateProjectInputData,
} from './create-project-input.schema'
import { KnittoError } from '../../core/errors/knitto-error'
import { Errors } from '../../core/errors/errors'

export class CreateProjectInputValidator {
  validate(input: CreateProjectInput): CreateProjectInputData {
    try {
      return CreateProjectInputSchema.parse(input)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new KnittoError(
          error.issues[0]?.message ?? 'Invalid create project input',
          Errors.INVALID_CREATE_PROJECT_INPUT,
          error.issues
        )
      }

      throw error
    }
  }
}
