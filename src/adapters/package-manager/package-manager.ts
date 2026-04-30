export interface PackageManager {
  install(cwd: string): Promise<void>
}
