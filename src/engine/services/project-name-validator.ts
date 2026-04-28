import type { ProjectName } from '../../core/schemas/project-name.schema.js'

type ProjectNameValidatorInput = {
  projectName: ProjectName
}

export class ProjectNameValidator {
  async validate(input: ProjectNameValidatorInput): Promise<void> {}
}
