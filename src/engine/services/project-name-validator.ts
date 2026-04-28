import {
  projectNameSchema,
  type ProjectName,
} from '../../core/schemas/project-name.schema.js'

type ProjectNameValidatorInput = {
  projectName: ProjectName
}

export class ProjectNameValidator {
  async validate(input: ProjectNameValidatorInput): Promise<ProjectName> {
    try {
      await projectNameSchema.parseAsync(input.projectName)

      return Promise.resolve(input.projectName)
    } catch (error) {
      console.log('Name validation error: ', error)
      return Promise.reject(new Error('Invalid project name'))
    }
  }
}
