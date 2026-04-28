import { ProjectNameValidator } from '../engine/services/project-name-validator.js'
import { CreateProjectUseCase } from '../engine/use-cases/create-project.use-case.js'

export type App = {
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const projectNameValidator = new ProjectNameValidator()

  const createProjectUseCase = new CreateProjectUseCase({
    projectNameValidator,
  })

  return {
    createProjectUseCase,
  }
}
