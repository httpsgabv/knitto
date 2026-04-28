type CreateProjectUseCaseInput = {
  projectName: string
  kitSlug: string
  featureSlug: string[]
  packageManager: 'npm' | 'yarn' | 'pnpm'
}

export class CreateProjectUseCase {
  constructor() {}

  async execute(input: CreateProjectUseCaseInput) {
    console.log('Creating project with the following input: ', input)
    return Promise.resolve()
  }
}
