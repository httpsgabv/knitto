import { CreateProjectUseCase } from '../engine/use-cases/create-project.use-case.js'

export type App = {
  createProjectUseCase: CreateProjectUseCase
}

export function createApp(): App {
  const createProjectUseCase = new CreateProjectUseCase()

  return {
    createProjectUseCase,
  }
}
