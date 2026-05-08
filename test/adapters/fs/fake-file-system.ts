import type { FileSystem } from '@adapters/fs/file-system'
import { normalizeRelativePath, normalizeSystemPath } from '@shared/paths'

export interface FakeFileSystemCall {
  method: keyof FileSystem
  args: any[]
}

export class FakeFileSystem implements FileSystem {
  private calls: FakeFileSystemCall[] = []
  private files: Map<string, string> = new Map()
  private directories: Set<string> = new Set()

  async pathExists(path: string): Promise<boolean> {
    this.calls.push({ method: 'pathExists', args: [path] })

    const normalizedPath = this.normalizePath(path)

    if (normalizedPath.includes('/not-exist-after-clone/')) {
      return false
    }

    if (this.directories.has(normalizedPath) || this.files.has(normalizedPath)) {
      return true
    }

    for (const dir of this.directories) {
      if (normalizedPath.startsWith(dir)) {
        return true
      }
    }

    return false
  }

  async ensureDir(path: string): Promise<void> {
    this.calls.push({ method: 'ensureDir', args: [path] })
    this.directories.add(this.normalizePath(path))
  }

  async readFile(path: string, encoding: BufferEncoding): Promise<string> {
    this.calls.push({ method: 'readFile', args: [path, encoding] })
    const content = this.files.get(this.normalizePath(path))
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return content
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.calls.push({ method: 'writeFile', args: [path, content] })
    this.files.set(this.normalizePath(path), content)
  }

  async readJson<T>(path: string): Promise<T> {
    this.calls.push({ method: 'readJson', args: [path] })
    const content = this.files.get(this.normalizePath(path))
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return JSON.parse(content) as T
  }

  async writeJson(path: string, value: unknown): Promise<void> {
    this.calls.push({ method: 'writeJson', args: [path, value] })
    this.files.set(this.normalizePath(path), JSON.stringify(value))
  }

  async copyDir(src: string, dest: string): Promise<void> {
    this.calls.push({ method: 'copyDir', args: [src, dest] })
    const normalizedSrc = this.normalizePath(src)
    const normalizedDest = this.normalizePath(dest)

    this.directories.add(normalizedDest)

    for (const dir of this.directories) {
      if (dir === normalizedSrc || dir.startsWith(`${normalizedSrc}/`)) {
        this.directories.add(dir.replace(normalizedSrc, normalizedDest))
      }
    }

    for (const [filePath, content] of this.files) {
      if (filePath.startsWith(`${normalizedSrc}/`)) {
        this.files.set(filePath.replace(normalizedSrc, normalizedDest), content)
      }
    }
  }

  async listFiles(root: string): Promise<string[]> {
    this.calls.push({ method: 'listFiles', args: [root] })
    const normalizedRoot = this.normalizePath(root)
    const files: string[] = []

    for (const [filePath] of this.files) {
      if (filePath.startsWith(`${normalizedRoot}/`)) {
        files.push(normalizeRelativePath(filePath.slice(normalizedRoot.length)))
      }
    }

    return files
  }

  getCalls(): FakeFileSystemCall[] {
    return [...this.calls]
  }

  getCallsByMethod(method: keyof FileSystem): FakeFileSystemCall[] {
    return this.calls.filter((call) => call.method === method)
  }

  clearCalls(): void {
    this.calls = []
  }

  addDirectory(path: string): void {
    this.directories.add(this.normalizePath(path))
  }

  addFile(path: string, content: string): void {
    this.files.set(this.normalizePath(path), content)
  }

  private normalizePath(path: string): string {
    return normalizeSystemPath(path)
  }
}
