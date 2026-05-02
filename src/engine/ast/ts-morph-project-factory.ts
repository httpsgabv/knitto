import { Project, QuoteKind } from 'ts-morph'

export class TsMorphProjectFactory {
  create(): Project {
    return new Project({
      skipAddingFilesFromTsConfig: true,
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
      },
    })
  }
}
