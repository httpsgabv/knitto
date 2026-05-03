import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { ReadmeMerger } from './readme-merger'

describe('ReadmeMerger', () => {
  it('creates the target readme when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new ReadmeMerger(fileSystem)

    fileSystem.addFile('/template/feature.md', '\nFeature details\n\n')

    await merger.merge('/template/feature.md', '/project/README.md', 'Feature')

    expect(await fileSystem.readFile('/project/README.md', 'utf8')).toBe(
      '## Feature\n\nFeature details\n\n'
    )
  })

  it('appends a headed section to an existing readme with normalized spacing', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new ReadmeMerger(fileSystem)

    fileSystem.addFile('/template/feature.md', 'New section body\n')
    fileSystem.addFile('/project/README.md', '# Project\n\nExisting intro\n\n')

    await merger.merge('/template/feature.md', '/project/README.md', 'Feature')

    expect(await fileSystem.readFile('/project/README.md', 'utf8')).toBe(
      '# Project\n\nExisting intro\n\n## Feature\n\nNew section body\n\n'
    )
  })
})
