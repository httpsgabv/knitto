import type { FileSystem } from '@adapters/fs/file-system'

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

    if (path.includes('/not-exist-after-clone/')) {
      return false
    }

    if (this.directories.has(path) || this.files.has(path)) {
      return true
    }
    for (const dir of this.directories) {
      if (path.startsWith(dir) || path.startsWith(dir.replace(/\\/g, '/'))) {
        return true
      }
      const normalizedDir = dir.replace(/\\/g, '/')
      if (path.startsWith(normalizedDir)) {
        return true
      }
    }
    return false
  }

  async ensureDir(path: string): Promise<void> {
    this.calls.push({ method: 'ensureDir', args: [path] })
    this.directories.add(path)
  }

  async readFile(path: string, encoding: BufferEncoding): Promise<string> {
    this.calls.push({ method: 'readFile', args: [path, encoding] })
    const content = this.files.get(path)
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return content
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.calls.push({ method: 'writeFile', args: [path, content] })
    this.files.set(path, content)
  }

  async readJson<T>(path: string): Promise<T> {
    this.calls.push({ method: 'readJson', args: [path] })
    const content = this.files.get(path)
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return JSON.parse(content) as T
  }

  async writeJson(path: string, value: unknown): Promise<void> {
    this.calls.push({ method: 'writeJson', args: [path, value] })
    this.files.set(path, JSON.stringify(value))
  }

  async listFiles(root: string): Promise<string[]> {
    this.calls.push({ method: 'listFiles', args: [root] })
    const files: string[] = []
    for (const [filePath] of this.files) {
      if (filePath.startsWith(root)) {
        files.push(filePath.slice(root.length + 1))
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
    this.directories.add(path)
  }

  addFile(path: string, content: string): void {
    this.files.set(path, content)
  }
}
