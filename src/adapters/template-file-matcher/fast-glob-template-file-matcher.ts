import fg from 'fast-glob'
import type { Dirent, Stats } from 'node:fs'
import type { TemplateFile } from '@core/template/template-file'
import type { TemplateFileMatcher } from '@adapters/template-file-matcher/template-file-matcher'
import {
  joinSystemPath,
  normalizeRelativePath,
  normalizeSystemPath,
} from '@shared/paths'

export class FastGlobTemplateFileMatcher implements TemplateFileMatcher {
  match(input: {
    files: TemplateFile[]
    include: string[]
    exclude: string[]
  }): Set<string> {
    const root = this.getTemplateRoot(input.files[0])

    return new Set(
      fg.globSync(input.include.length === 0 ? ['**/*'] : input.include, {
        cwd: root,
        dot: true,
        onlyFiles: true,
        ignore: input.exclude,
        fs: this.createFileSystemAdapter(input.files, root) as never,
      })
    )
  }

  private getTemplateRoot(file: TemplateFile | undefined): string {
    if (file === undefined) {
      return '.'
    }

    const absolutePath = normalizeSystemPath(file.absolutePath)
    const relativePath = normalizeRelativePath(file.relativePath)

    if (relativePath.length === 0) {
      return absolutePath
    }

    const root = absolutePath.slice(
      0,
      absolutePath.length - relativePath.length
    )

    return root.endsWith('/') ? root.slice(0, -1) : root
  }

  private createFileSystemAdapter(files: TemplateFile[], root: string) {
    const normalizedRoot = this.normalizeRootPath(root)
    const directories = new Map<string, Set<string>>()
    const filePaths = new Set<string>()

    directories.set(normalizedRoot, new Set())

    for (const file of files) {
      const relativePath = normalizeRelativePath(file.relativePath)
      if (relativePath.length === 0) {
        continue
      }

      const absolutePath = joinSystemPath(normalizedRoot, relativePath)
      filePaths.add(absolutePath)

      const segments = relativePath.split('/')
      let currentDirectory = normalizedRoot

      for (const segment of segments.slice(0, -1)) {
        const nextDirectory = joinSystemPath(currentDirectory, segment)
        this.addEntry(directories, currentDirectory, segment)
        directories.set(
          nextDirectory,
          directories.get(nextDirectory) ?? new Set()
        )
        currentDirectory = nextDirectory
      }

      const fileName = segments[segments.length - 1]
      if (fileName !== undefined) {
        this.addEntry(directories, currentDirectory, fileName)
      }
    }

    return {
      lstatSync: (entryPath: string) =>
        this.createStats(entryPath, normalizedRoot, directories, filePaths),
      statSync: (entryPath: string) =>
        this.createStats(entryPath, normalizedRoot, directories, filePaths),
      readdirSync: (directoryPath: string) => {
        const normalizedDirectoryPath = this.resolveAdapterPath(
          directoryPath,
          normalizedRoot
        )
        const entries = [...(directories.get(normalizedDirectoryPath) ?? new Set())]

        return entries.map((entry) => {
          const fullPath = joinSystemPath(normalizedDirectoryPath, entry)
          const isDirectory = directories.has(fullPath)

          return {
            name: entry,
            isDirectory: () => isDirectory,
            isFile: () => !isDirectory,
            isSymbolicLink: () => false,
          } as Dirent
        })
      },
    }
  }

  private addEntry(
    directories: Map<string, Set<string>>,
    directoryPath: string,
    entryName: string
  ): void {
    const entries = directories.get(directoryPath) ?? new Set<string>()
    entries.add(entryName)
    directories.set(directoryPath, entries)
  }

  private createStats(
    entryPath: string,
    root: string,
    directories: Map<string, Set<string>>,
    filePaths: Set<string>
  ): Stats {
    const normalizedPath = this.resolveAdapterPath(entryPath, root)
    const isDirectory = directories.has(normalizedPath)
    const isFile = filePaths.has(normalizedPath)

    return {
      atime: new Date(0),
      atimeMs: 0,
      birthtime: new Date(0),
      birthtimeMs: 0,
      blksize: 0,
      blocks: 0,
      ctime: new Date(0),
      ctimeMs: 0,
      dev: 0,
      gid: 0,
      ino: 0,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isDirectory: () => isDirectory,
      isFIFO: () => false,
      isFile: () => isFile,
      isSocket: () => false,
      isSymbolicLink: () => false,
      mode: 0,
      mtime: new Date(0),
      mtimeMs: 0,
      nlink: 1,
      rdev: 0,
      size: 0,
      uid: 0,
    }
  }

  private resolveAdapterPath(entryPath: string, root: string): string {
    const normalizedEntryPath = normalizeSystemPath(entryPath)

    if (normalizedEntryPath === '.' || normalizedEntryPath === '') {
      return root
    }

    if (this.isVirtualAbsolutePath(normalizedEntryPath)) {
      return this.rebaseToVirtualRoot(normalizedEntryPath, root)
    }

    return joinSystemPath(root, normalizeRelativePath(normalizedEntryPath))
  }

  private normalizeRootPath(root: string): string {
    return normalizeSystemPath(root)
  }

  private isVirtualAbsolutePath(pathValue: string): boolean {
    return /^[A-Za-z]:\//.test(pathValue) || pathValue.startsWith('/')
  }

  private rebaseToVirtualRoot(pathValue: string, root: string): string {
    if (pathValue === root || pathValue.startsWith(`${root}/`)) {
      return pathValue
    }

    if (pathValue.endsWith(root)) {
      return root
    }

    const rootedIndex = pathValue.indexOf(`${root}/`)
    if (rootedIndex >= 0) {
      return pathValue.slice(rootedIndex)
    }

    return pathValue
  }
}
